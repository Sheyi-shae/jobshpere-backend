import express from 'express';
import Stripe from 'stripe';
import db from '../libs/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const webhookRouter = express.Router();


webhookRouter.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
       case 'checkout.session.completed': {
  const session = event.data.object;
  const stripeCustomerId = session.customer;
  const stripeSubscriptionId = session.subscription;
    // default to Stripe subscription if available
  let subscriptionEndDate = null;

  if (session.subscription) {
    // Fetch full subscription details
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    if (subscription?.current_period_end) {
      subscriptionEndDate = new Date(subscription.current_period_end * 1000);
    }
  }

 // fallback: 30 days after session creation
if (!subscriptionEndDate) {
  if (session.created) {
    const createdMs = session.created * 1000; // convert to ms
    subscriptionEndDate = new Date(createdMs + 30 * 24 * 60 * 60 * 1000); // add 30 days in ms
  } else {
    // ultimate fallback: now + 30 days
    subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
}

  await db.company.update({
    where: { stripeCustomerId },
    data: {
      subscriptionStatus: 'active',
      stripeSubscriptionId,
      subscriptionEndDate
    },
  });
  break;
}


        case 'customer.subscription.deleted':
        case 'invoice.payment_failed': {
          const subscription = event.data.object;
          const stripeCustomerId = subscription.customer;

          await db.company.update({
            where: { stripeCustomerId },
            data: {
              subscriptionStatus: 'inactive',
              stripeSubscriptionId: null,
            },
          });
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const stripeCustomerId = subscription.customer;
           const subscriptionEndDate = new Date(subscription.current_period_end * 1000); // convert to JS date


         const company = await db.company.update({
            where: { stripeCustomerId },
            data: {
              subscriptionStatus: subscription.status,
              stripeSubscriptionId: subscription.id,
              subscriptionEndDate
            },
          });

          //update activity
        await db.activity.create({
        data: {
            type: 'PAYMENT',
            user:'system',
            companyId: company.id,
            action: `Monthly Subscription status updated: ${subscription.status}`
        }
        });
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error('Webhook event handling failed:', err.message);
      res.status(500).send('Internal Server Error');
    }
  }
);

export default webhookRouter;
