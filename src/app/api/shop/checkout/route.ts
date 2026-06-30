import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { productId, buyerName, buyerEmail, shippingAddress } = await request.json();
    
    if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    if (!buyerEmail) return NextResponse.json({ error: 'Email address required' }, { status: 400 });

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.stock <= 0) return NextResponse.json({ error: 'Product out of stock' }, { status: 400 });

    // Generate a unique 6-character alphanumeric reference code
    const referenceCode = 'HTK-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Create the order in the database
    const totalAmount = product.price + (product.shippingPrice || 0);
    const order = await db.order.create({
      data: {
        referenceCode,
        productId: product.id,
        buyerName: buyerName || null,
        buyerEmail,
        shippingAddress: shippingAddress || null,
        totalAmount,
        status: 'PENDING'
      }
    });

    // Optionally reserve the stock
    await db.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 1 } }
    });

    // Send email notification to shop owner and dropshippers
    // In production, use SendGrid, Resend, Nodemailer, etc.
    const shopOwnerEmail = process.env.ADMIN_EMAIL || 'admin@hatakesocial.com';
    let notifyEmails = [shopOwnerEmail];
    
    if (product.notificationEmails) {
      const customEmails = product.notificationEmails.split(',').map(e => e.trim()).filter(Boolean);
      notifyEmails = [...notifyEmails, ...customEmails];
    }
    
    // De-duplicate emails
    notifyEmails = Array.from(new Set(notifyEmails));

    console.log(`
      ================================================
      📧 EMAIL NOTIFICATION TO SHOP OWNER & DROPSHIPPERS
      ================================================
      To: ${notifyEmails.join(', ')}
      Subject: New Order Received [${referenceCode}]
      
      You have received a new manual payment order!
      
      Order Reference: ${referenceCode}
      Product: ${product.name}
      Product Weight: ${product.weight || 0} kg
      Product Price: €${product.price.toFixed(2)}
      Shipping: €${(product.shippingPrice || 0).toFixed(2)}
      Amount Expected: €${totalAmount.toFixed(2)}
      
      Buyer Name: ${buyerName || 'Not provided'}
      Buyer Email: ${buyerEmail}
      Shipping Address: 
      ${shippingAddress || 'No shipping address provided (Digital good)'}
      
      Please verify the funds on your Swish/PayPal/Bank Account
      under the reference code ${referenceCode}.
      ================================================
    `);

    return NextResponse.json({ order });
  } catch (err) {
    console.error('Checkout API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
