import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
<section className="hero">
  <div className="heroHeader">
    <div className="heroLogo">
      <Image
        src="/logo.png"
        alt="Executive Pro Cleaning logo"
        width={144}
        height={144}
        priority
        style={{ width: "144px", height: "144px" }}
      />
    </div>

    <div className="heroText">
      <h1>Executive Pro Cleaning</h1>
      <p className="lead">
        Reliable cleaning and day-to-day support across <strong>Canberra, Queanbeyan, and Royalla</strong>.
      </p>
    </div>
  </div>
        <div className="grid2">
          <Link href="/services" className="cardLink" aria-label="Go to services page">
  <div className="card cardHover">
    <div className="homeImageWrap">
  <Image
    src="/images/bathroom.jpg"
    alt="Clean bathroom"
    fill
    sizes="(max-width: 820px) 100vw, 50vw"
    style={{ objectFit: "cover" }}
    priority
  />
</div>
    <div className="cardInner homeCardText">
      <strong>Cleaning & household tasks</strong>
      <p style={{ marginTop: 6, marginBottom: 0, color: "var(--muted)" }}>
        Practical support to keep your home comfortable and organised.
      </p>
    </div>
  </div>
</Link> 
          <Link href="/services" className="cardLink" aria-label="Go to services page">
  <div className="card cardHover">
    <div className="homeImageWrap">
  <Image
    src="/images/transport.jpg"
    alt="Transport assistance"
    fill
    sizes="(max-width: 820px) 100vw, 50vw"
    style={{ objectFit: "cover" }}
  />
</div>
    <div className=" cardInner homeCardText">
      <strong>Appointments, shopping, and transport</strong>
      <p style={{ marginTop: 6, marginBottom: 0, color: "var(--muted)" }}>
        Help with everyday tasks and getting where you need to go.
      </p>
    </div>
  </div>
</Link>
        </div>
      </section>

      <section className="section whyChoose">
        <h2>Why choose us?</h2>
        <p>
          Executive Pro Cleaning has been proudly supporting local clients since <strong>2021</strong>, with{" "}
          <strong>200+ clients</strong> helped across Canberra, Queanbeyan, and Royalla. We focus on reliability,
          clear communication, and respectful service that makes day-to-day life easier.
        </p>
        <ul>
          <li>Local, trusted support since 2021</li>
          <li>Flexible help across home and community tasks</li>
          <li>Clear pricing and straightforward booking</li>
          <li>Professional, respectful service</li>
        </ul>
      </section>
    </>
  );
}