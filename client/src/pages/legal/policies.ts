interface PolicySection {
  heading: string
  body: string[]
}

export interface PolicyDocument {
  title: string
  updated: string
  intro?: string
  sections: PolicySection[]
}

export const POLICIES: Record<string, PolicyDocument> = {
  privacy: {
    title: 'Privacy Policy',
    updated: '2026-06-05',
    intro:
      'OTHER SIDE ("we", "us") operates the otherside men\'s fashion store. This policy explains what data we collect, why, and your choices.',
    sections: [
      {
        heading: 'Information we collect',
        body: [
          'Account data: name, email, and password hash when you register.',
          'Order data: shipping address, phone, items purchased, and payment method selected (COD, WhatsApp, or Whish Pay).',
          'Technical data: cookies for login sessions, CSRF protection, and cart persistence.',
          'Optional: Google profile data if you sign in with Google OAuth.',
        ],
      },
      {
        heading: 'How we use data',
        body: [
          'Process and fulfil orders.',
          'Authenticate your account and protect against fraud.',
          'Improve the store and respond to support requests.',
          'We do not sell your personal data to third parties.',
        ],
      },
      {
        heading: 'Storage & security',
        body: [
          'Data is stored in MongoDB Atlas (encrypted at rest) and cached in Upstash Redis where applicable.',
          'Passwords are hashed with bcrypt. Auth tokens use httpOnly secure cookies in production.',
          'Admin access is role-restricted and rate-limited.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Request access, correction, or deletion of your account data by contacting us.',
          'Withdraw consent for marketing emails at any time (when newsletter is enabled).',
        ],
      },
      {
        heading: 'Contact',
        body: ['Privacy questions: use the Contact page or the address in our security.txt file.'],
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    updated: '2026-06-05',
    intro: 'By using the OTHER SIDE website you agree to these terms.',
    sections: [
      {
        heading: 'Orders & pricing',
        body: [
          'All prices are shown in USD unless stated otherwise.',
          'We reserve the right to cancel orders in case of pricing errors or stock unavailability.',
          'Product images are representative; colours may vary slightly on screen.',
        ],
      },
      {
        heading: 'Payment',
        body: [
          'We accept Cash on Delivery (COD), WhatsApp order confirmation, and Whish Pay where available in Lebanon.',
          'Stripe is not used for Lebanon merchant checkout.',
        ],
      },
      {
        heading: 'Shipping & returns',
        body: [
          'See our Shipping & Returns page for delivery areas, timelines, and return eligibility.',
          'Custom or final-sale items may not be returnable.',
        ],
      },
      {
        heading: 'Accounts',
        body: [
          'You are responsible for keeping your login credentials secure.',
          'We may suspend accounts that violate these terms or abuse the service.',
        ],
      },
      {
        heading: 'Limitation of liability',
        body: [
          'OTHER SIDE is provided "as is". We are not liable for indirect damages to the extent permitted by applicable law.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    updated: '2026-06-05',
    sections: [
      {
        heading: 'What are cookies?',
        body: ['Cookies are small files stored in your browser to keep you signed in and protect forms.'],
      },
      {
        heading: 'Cookies we use',
        body: [
          'token — httpOnly session cookie for authenticated users (required for login).',
          'cartId — identifies your shopping bag (guest or logged-in).',
          '__csrf — CSRF protection for checkout and admin actions.',
          'oauth_state — temporary cookie during Google sign-in.',
          'otherside-theme — stores light/dark theme preference (localStorage, not a cookie).',
        ],
      },
      {
        heading: 'Managing cookies',
        body: [
          'You can clear cookies in your browser settings. Blocking required cookies will prevent checkout and login.',
        ],
      },
    ],
  },
  'security-policy': {
    title: 'Security Policy',
    updated: '2026-06-05',
    intro: 'We take security seriously. Report vulnerabilities responsibly.',
    sections: [
      {
        heading: 'Reporting vulnerabilities',
        body: [
          'Email security contacts listed at /.well-known/security.txt.',
          'Please include steps to reproduce and avoid public disclosure until we respond.',
          'We aim to acknowledge reports within 72 hours.',
        ],
      },
      {
        heading: 'Measures in place',
        body: [
          'HTTPS everywhere in production (Cloudflare TLS).',
          'CSRF protection on mutating API routes.',
          'Rate limiting on auth, admin, and global API traffic.',
          'Input validation (Zod), NoSQL sanitization, and helmet security headers.',
          'Role-based admin access re-validated from the database on every request.',
          'Google OAuth uses state parameter verification.',
        ],
      },
      {
        heading: 'Out of scope',
        body: [
          'Social engineering, physical attacks, or issues in third-party services (Google, MongoDB Atlas, Upstash) should be reported to those vendors.',
        ],
      },
    ],
  },
  shipping: {
    title: 'Shipping & Returns',
    updated: '2026-06-05',
    sections: [
      {
        heading: 'Shipping',
        body: [
          'We ship within Lebanon and internationally where available.',
          'Processing time: 1–3 business days after order confirmation.',
          'Delivery times vary by city; COD orders may require phone confirmation.',
        ],
      },
      {
        heading: 'Returns',
        body: [
          'Unworn items with tags may be returned within 14 days of delivery.',
          'Contact us before sending returns. Refunds apply to eligible items only.',
          'Sale items may be final sale unless defective.',
        ],
      },
    ],
  },
  returns: {
    title: 'Returns',
    updated: '2026-06-05',
    sections: [
      {
        heading: 'How to return',
        body: [
          'Email or WhatsApp us with your order ID and reason for return.',
          'We will provide return instructions and the nearest drop-off or pickup option.',
        ],
      },
    ],
  },
  contact: {
    title: 'Contact Us',
    updated: '2026-06-05',
    sections: [
      {
        heading: 'Customer support',
        body: [
          'WhatsApp: contact us via the Order on WhatsApp button on product pages for order help.',
          'Email: support@otherside.com (update to your real address before launch).',
          'Instagram: @othersidemen',
        ],
      },
      {
        heading: 'Business',
        body: ['Baabda, Lebanon — in-store pickup available for selected items.'],
      },
    ],
  },
  faq: {
    title: 'FAQ',
    updated: '2026-06-05',
    sections: [
      {
        heading: 'Do I need an account to order?',
        body: ['Yes — sign in or create an account to complete checkout securely.'],
      },
      {
        heading: 'How do I pay?',
        body: ['Cash on delivery, WhatsApp order confirmation, or Whish Pay when enabled.'],
      },
      {
        heading: 'Where are product photos from?',
        body: [
          'Our catalog uses Otherside Men lookbook photos stored on our CDN. Each product links to one image and metadata in our database.',
        ],
      },
    ],
  },
  about: {
    title: 'About OTHER SIDE',
    updated: '2026-06-05',
    sections: [
      {
        heading: 'Two sides. One identity.',
        body: [
          'OTHER SIDE is a men\'s fashion brand blending minimal and street aesthetics.',
          'Shop 791+ curated looks imported from our Otherside Men collection.',
        ],
      },
    ],
  },
  payment: {
    title: 'Payment Methods',
    updated: '2026-06-05',
    sections: [
      {
        heading: 'Available methods',
        body: [
          'Cash on Delivery (COD) — pay when your order arrives.',
          'WhatsApp — confirm your order with our team before dispatch.',
          'Whish Pay — Lebanon mobile payments when merchant onboarding is complete.',
        ],
      },
    ],
  },
}

export const POLICY_ROUTES = Object.keys(POLICIES)
