import Image from "next/image";

export const metadata = {
  title: "Before & After | Executive Pro Cleaning",
};

const GALLERIES = [
  {
    room: "Bedroom",
    before: { src: "/images/before-after/before-bedroom.jpg", alt: "Bedroom before cleaning" },
    after: { src: "/images/before-after/after-bedroom.jpg", alt: "Bedroom after cleaning" },
  },
  {
    room: "Kitchen",
    before: { src: "/images/before-after/before-kitchen.jpg", alt: "Kitchen before cleaning" },
    after: { src: "/images/before-after/after-kitchen.jpg", alt: "Kitchen after cleaning" },
  },
  {
    room: "Living room",
    before: { src: "/images/before-after/before-living-room.jpg", alt: "Living room before cleaning" },
    after: { src: "/images/before-after/after-living-room.jpg", alt: "Living room after cleaning" },
  },
];

function BeforeAfterCard({ room, before, after }) {
  return (
    <article className="baCard">
      <h2 className="baRoomTitle">{room}</h2>

      <div className="baPair">
        <div className="baSide">
          <div className="baImageWrap">
            <span className="baLabel">Before</span>
            <Image
              src={before.src}
              alt={before.alt}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="baImage"
            />
          </div>
        </div>

        <div className="baSide">
          <div className="baImageWrap">
            <span className="baLabel">After</span>
            <Image
              src={after.src}
              alt={after.alt}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="baImage"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BeforeAfterPage() {
  return (
    <section className="section">
      <h1>Before & After</h1>
      <p className="lead">
        Examples of cleaning results from real homes. Photos shown with permission.
      </p>

      <div className="baGrid">
        {GALLERIES.map((g) => (
          <BeforeAfterCard key={g.room} room={g.room} before={g.before} after={g.after} />
        ))}
      </div>
    </section>
  );
}