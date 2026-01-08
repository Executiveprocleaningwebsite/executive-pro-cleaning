"use client";

import { useState } from "react";

const SERVICES = [
  {
    id: "cleaning",
    title: "Cleaning",
    blurb: "Practical cleaning support to keep your home comfortable, safe, and organised.",
    examples: [
      "Bathroom cleaning",
      "Vacuuming and mopping",
      "Dishes and kitchen clean-up",
      "Living areas and bedrooms",
      "Garage tidy and light cleaning",
      "Backyard tidy (light duties)",
      "End of lease cleaning (by request)",
      "Spot cleaning and spill clean-up",
      "Change linen and basic bedroom reset",
    ],
  },
  {
    id: "household",
    title: "Household tasks",
    blurb: "Support with day-to-day household jobs that help you stay on top of your routine.",
    examples: [
      "Laundry: washing, hanging, folding",
      "Rubbish removal and bin management",
      "Basic organising and decluttering support",
      "Light meal preparation support (simple tasks)",
      "Watering plants",
      "Pet support: feeding, basic care, and routines",
      "Dog walking (by request)",
      "Unpacking groceries and putting items away",
      "Assist with household checklists and reminders",
    ],
  },
  {
    id: "community",
    title: "Social & Community Participation",
    blurb: "Support to stay connected, build confidence, and participate in your community.",
    examples: [
      "Help with social planning and weekly activities",
      "Support attending community events and groups",
      "Building confidence with social interactions",
      "Support to access public amenities",
      "Help establishing routines for getting out and about",
      "Support with hobbies, classes, and local programs",
      "Encouragement and structured goal setting",
    ],
  },
  {
    id: "appointments",
    title: "Assistance with Appointments & Shopping",
    blurb: "Practical support to help you manage errands, attend appointments, and stay organised.",
    examples: [
      "Support while you shop",
      "Do the shopping for you (with a list)",
      "Assistance with collecting scripts or essentials",
      "Help write down key information during appointments",
      "Support with checklists, schedules, and reminders",
      "Help prepare questions before appointments",
      "Support organising receipts and basic paperwork",
    ],
  },
  {
    id: "transport",
    title: "Transport",
    blurb: "Transport support across Canberra, Queanbeyan, and Royalla to help you get where you need to go.",
    examples: [
      "Appointments and errands",
      "School or work",
      "Sport and recreational activities",
      "Community events and public amenities",
      "Family visits",
      "Shopping trips",
      "Support to attend programs and classes",
    ],
  },
  {
    id: "family",
    title: "Family Visits",
    blurb: "Support to help you attend and manage family visits comfortably.",
    examples: [
      "Transport to and from family visits",
      "Planning and preparation before a visit",
      "Support with communication and routines",
      "Support to help you feel calm and organised",
      "Assistance returning home and resetting after the visit",
    ],
  },
];

export default function Services() {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="section">
      <h1>Services</h1>
      <p className="mutedText" style={{ marginTop: 6 }}>
        Tap or click a service to expand and view examples.
      </p>

      <div className="servicesBubblesGrid">
        {SERVICES.map((s) => {
          const isOpen = openId === s.id;
          const panelId = `service-panel-${s.id}`;

          return (
            <article
              key={s.id}
              className={`serviceBubble ${isOpen ? "isOpen" : ""}`}
            >
              <button
                type="button"
                className="serviceBubbleHeader"
                onClick={() => setOpenId(isOpen ? null : s.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <div className="serviceBubbleTitleRow">
                  <h3 className="serviceBubbleTitle">{s.title}</h3>
                  <span className="serviceBubblePill">{isOpen ? "Hide" : "View"}</span>
                </div>

                <p className="serviceBubbleBlurb">{s.blurb}</p>
              </button>

              <div
                id={panelId}
                className="serviceBubblePanel"
                hidden={!isOpen}
              >
                <div className="serviceBubblePanelInner">
                  <strong>Examples</strong>
                  <ul>
                    {s.examples.map((ex) => (
                      <li key={ex}>{ex}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}