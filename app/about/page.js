export default function About() {
  return (
    <section className="section aboutPage">
      <h1>About us</h1>

      <div className="aboutHero">
  <div className="aboutHeroTop">
    <p className="aboutLead">
      <span className="noBreakSentence"> 
      <strong>Executive Pro Cleaning</strong> provides <strong>NDIS support</strong> across{" "}
      <strong>Canberra, Queanbeyan, and Royalla</strong>. Since <strong>2021</strong>, we’ve supported <strong>200+ clients</strong> with reliable cleaning, community access, and practical day-to-day support.
      </span>
    </p>

    <p className="aboutSub">
      Our focus is simple: <strong>clear communication</strong>, <strong>respectful service</strong>, and <strong>reliable support</strong> so you can feel confident and comfortable at home and in your community.
    </p>
  </div>

  <div className="aboutBadges">
    <div className="badgeCard">
      <p className="badgeTitle"><strong>Service area</strong></p>
      <p className="badgeText">Canberra • Queanbeyan • Royalla</p>
    </div>

    <div className="badgeCard">
      <p className="badgeTitle"><strong>Experience</strong></p>
      <p className="badgeText">Established 2021 • 200+ clients supported</p>
    </div>
  </div>
</div>

      <hr className="divider" />

      <h2>Our Core Values</h2>

      <div className="valuesGrid">
        <div className="valueCard">
          <p className="valueTitle"><strong>Dignity &amp; Respect:</strong></p>
          <p className="valueText">
            We believe every individual deserves to be heard and supported without judgement. We approach
            every task with the utmost respect for your privacy, choices, and autonomy.
          </p>
        </div>

        <div className="valueCard">
          <p className="valueTitle"><strong>Unwavering Reliability:</strong></p>
          <p className="valueText">
            For our clients, consistency is safety. We show up on time and as promised for a shift, an
            appointment, or a transport booking. You can count on us to be a dependable foundation in
            your routine.
          </p>
        </div>

        <div className="valueCard">
          <p className="valueTitle"><strong>Compassionate Partnership:</strong></p>
          <p className="valueText">
            We don’t just perform tasks, we build supportive relationships. We listen, understand your
            goals, and work with you as a partner in improving wellbeing and supporting independence.
          </p>
        </div>

        <div className="valueCard">
          <p className="valueTitle"><strong>Local Community Heart:</strong></p>
          <p className="valueText">
            As a Canberra-based team, we’re invested in our community. We understand local services,
            routes, and challenges, and we’re genuinely committed to the wellbeing of our neighbours.
          </p>
        </div>

        <div className="valueCard">
          <p className="valueTitle"><strong>Integrity in Action:</strong></p>
          <p className="valueText">
            We operate with honesty and transparency in all our dealings. From clear pricing to reliable
            documentation, you can trust us to act in your best interests.
          </p>
        </div>
      </div>

      <hr className="divider" />

      <h2>Why clients choose us</h2>

      <div className="whyGrid">
        <div className="whyCard">
          <p className="whyTitle"><strong>Local experts who understand your community</strong></p>
          <p className="whyText">
            We’re not a distant franchise. As Canberra-based neighbours, we know local services, routes,
            and community networks, ensuring support that’s practical and connected.
          </p>
        </div>

        <div className="whyCard">
          <p className="whyTitle"><strong>Screened, respectful, and compassionate team</strong></p>
          <p className="whyText">
            Every team member is police-checked and chosen for both skill and genuine empathy. You receive
            consistent, reliable, and respectful support.
          </p>
        </div>

        <div className="whyCard">
          <p className="whyTitle"><strong>Flexible support built around your plan</strong></p>
          <p className="whyText">
            We adapt to your goals and schedule, whether you need cleaning, assistance with shopping and
            appointments, transport, or support getting out into the community.
          </p>
        </div>

        <div className="whyCard">
          <p className="whyTitle"><strong>One trusted team for multiple needs</strong></p>
          <p className="whyText">
            Simplify your life with a single provider for multiple support areas. We coordinate tasks to
            keep support consistent and straightforward.
          </p>
        </div>

        <div className="whyCard">
          <p className="whyTitle"><strong>Clear communication and documentation</strong></p>
          <p className="whyText">
            We keep things simple: clear expectations, transparent pricing, and professional communication
            so you feel informed and supported.
          </p>
        </div>
      </div>
    </section>
  );
}
