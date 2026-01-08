import Link from "next/link";

const FACEBOOK_URL =
  "https://www.facebook.com/share/1Bxh9ePBqc/?mibextid=wwXIfr";

const INSTAGRAM_URL =
  "https://www.instagram.com/cleaningexecutivepro/?igsh=MXZzNmtkZzh4emZl&utm_source=qr#";

export default function Socials() {
  return (
    <section className="section socialsPage">
      <h1>Socials</h1>
      <p className="mutedText">Follow Executive Pro Cleaning on social media.</p>

      <div className="socialCards">
        <Link
          className="socialCard"
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="socialIcon fb" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" role="img" focusable="false">
              <path
                d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6h1.6V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.5v3H10v8h3.5z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="socialText">
            <h2>Facebook</h2>
            <p>Updates, announcements, and service information.</p>
          </div>

          <div className="socialArrow" aria-hidden="true">→</div>
        </Link>

        <Link
          className="socialCard"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="socialIcon ig" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" role="img" focusable="false">
              <path
                fill="currentColor"
                d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5ZM18 6.7a1.1 1.1 0 1 1-1.1-1.1A1.1 1.1 0 0 1 18 6.7Z"
              />
            </svg>
          </div>

          <div className="socialText">
            <h2>Instagram</h2>
            <p>Before and after photos, updates, and client highlights.</p>
          </div>

          <div className="socialArrow" aria-hidden="true">→</div>
        </Link>
      </div>
    </section>
  );
}