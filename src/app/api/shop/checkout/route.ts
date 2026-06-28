import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholderForBuild', {
  apiVersion: '2026-06-24.dahlia' // Use the appropriate stripe API version
});

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.stock <= 0) return NextResponse.json({ error: 'Product out of stock' }, { status: 400 });

    // If there's no STRIPE_SECRET_KEY, return a mock URL for development
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY is missing. Returning mock checkout URL.');
      return NextResponse.json({ url: '/shop?success=true' });
    }

    // Try to create a checkout session
    let priceId = product.stripePriceId;
    
    // If no explicit stripePriceId is set on product, we create price on the fly (for simple demo purposes)
    // Real applications should sync their products to stripe beforehand and store priceId
    if (!priceId) {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        images: product.imageUrl ? [product.imageUrl] : [],
        description: product.description || undefined,
      });

      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(product.price * 100), // Stripe uses cents
        currency: 'eur',
      });

      priceId = stripePrice.id;
      
      // Save it back to DB for future use
      await db.product.update({
        where: { id: product.id },
        data: { stripePriceId: priceId }
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal', 'bancontact', 'ideal'], // Support European payment methods
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
