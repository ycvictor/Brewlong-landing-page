/**
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  EDIT YOUR WEBSITE TEXT HERE — this is the only file you need.        │
 * │                                                                       │
 * │  Everything the visitor reads lives below. Change the words between   │
 * │  the "quotes", save the file, and the site updates instantly.         │
 * │                                                                       │
 * │  Two rules:                                                           │
 * │    1. Keep the quotes "" around the text.                             │
 * │    2. Keep the comma , at the end of each line.                       │
 * └───────────────────────────────────────────────────────────────────────┘
 */

export const SITE = {
  /* ---- The basics ------------------------------------------------------ */
  name: "Brewlong",
  tagline: "tea meant for sharing",

  /* ---- Instagram (the button in the bottom-right corner) --------------- */
  instagram: "https://www.instagram.com/brewlong.tea/",
  handle: "@brewlong.tea",

  /* ---- The top of the page --------------------------------------------- */
  hero: {
    // The big handwritten headline under the logo.
    heading: "tea meant for sharing.",
    // The sentence under the headline.
    intro:
      "Brewlong is a pop-up tea bar serving single-origin oolong tea from Taiwan and handcrafted drinks.",
  },

  /* ---- The email sign-up box ------------------------------------------- */
  waitlist: {
    heading: "join the waitlist",
    intro: "Leave your email and we'll let you know where to find us next.",
    button: "join the waitlist",
    // Small grey print under the button.
    disclaimer: "One note when we pop up. No spam, no daily mail — unsubscribe any time.",
    // Shown after someone signs up successfully.
    successHeading: "the kettle's on!",
    successBody:
      "We'll send you a note when the next pop-up is announced. Thank you for sharing a pot with us!",
    // Shown when that email had already signed up before.
    duplicateHeading: "you're already with us!",
    duplicateBody: "We already had your email — we'll only write once, we promise.",
  },

  /* ---- YOUR STORY ------------------------------------------------------ */
  /* Each "..." below is one paragraph. Add or remove paragraphs freely —
     just keep each one wrapped in quotes and followed by a comma.          */
  about: {
    heading: "about",
    paragraphs: [
      "Brewlong is a pop-up tea bar serving single-origin oolong tea.",
      "We started Brewlong to bring a piece of Taiwanese culture to Seattle, and also highlight the incredible craftsmanship that goes into making oolong tea. Working directly with farmers in Taiwan, we personally select each tea to showcase the wide range of flavors that oolong tea can have.",
      "Each drink is made fresh to order, with syrups and purees made from real ingredients.",
      "Whether you're new to oolong or already love tea, we hope to share something special with you!",
    ],
  },

  /* ---- The very bottom line -------------------------------------------- */
  footer: "with warmth, Brewlong",

  /* ---- What search engines and link previews show ----------------------- */
  seo: {
    description:
      "Brewlong is a pop-up tea bar serving single-origin oolong tea from Taiwan and handcrafted drinks. Join the waitlist.",
  },
} as const;
