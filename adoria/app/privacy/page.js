import LegalPage, { Section } from "../../components/LegalPage";

export const metadata = {
  title: "Privacy Notice · Cubelle",
};

// Written against Malaysia's Personal Data Protection Act 2010. Two things
// that shaped it:
//
//   1. Section 7 requires the notice to be given in BOTH English and Bahasa
//      Malaysia. That's why this page is bilingual — it isn't decoration.
//   2. Section 129 restricts transferring personal data outside Malaysia.
//      Every service this site uses (Airtable, Upstash, Resend, Netlify,
//      ToyyibPay) processes data overseas, so that transfer is disclosed and
//      consented to here rather than left unsaid.
//
// The lists of data and recipients below are accurate to what the code
// actually collects and sends. If a field or a service is added, this page
// has to change with it — a privacy notice that doesn't match the system is
// worse than none, because it's a written claim that isn't true.

const UPDATED = "30 August 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Notice" updated={UPDATED}>
      <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 300, color: "var(--text-body)", marginTop: 0 }}>
        This notice explains what Cubelle collects about you, why, and what you can
        do about it. It is given under the Personal Data Protection Act 2010
        (Malaysia). The Bahasa Malaysia version follows below.
      </p>

      <hr style={{ border: 0, borderTop: "1px solid var(--border-panel)", margin: "34px 0" }} />

      <Section heading="Who we are">
        Cubelle is a small gift-box business baking and delivering from Kuantan,
        Pahang. You can reach us on WhatsApp at{" "}
        <a href="https://wa.me/60106509189" target="_blank" rel="noreferrer" style={{ color: "var(--accent-text)" }}>
          +60 10-650 9189
        </a>{" "}
        about anything on this page.
      </Section>

      <Section heading="What we collect">
        <p style={{ margin: "0 0 10px" }}>When you place an order:</p>
        <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
          <li>Your name, email address and phone number</li>
          <li>The recipient&rsquo;s name and delivery address</li>
          <li>The message you ask us to write on the card or letter</li>
          <li>What you ordered, the delivery date, and the amount paid</li>
        </ul>
        <p style={{ margin: "0 0 10px" }}>If you create an account:</p>
        <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
          <li>Your email address</li>
          <li>Your password, stored only as a bcrypt hash — we cannot read it</li>
          <li>
            If you turn on two-factor authentication, an encrypted authenticator
            secret and hashed backup codes
          </li>
        </ul>
        <p style={{ margin: 0 }}>
          We also record your IP address briefly when you sign in, reset a password
          or search for an order, purely to limit how often those can be attempted.
          We do not use advertising or analytics trackers, and the only cookie we set
          is the one that keeps you signed in.
        </p>
      </Section>

      <Section heading="Why we collect it">
        To bake and deliver your order, to let you track it, to contact you about it,
        to take payment, to run your account if you have one, and to protect the site
        from automated abuse. We do not sell your data or use it for advertising.
      </Section>

      <Section heading="The card message">
        The message you write is stored so we can write it out by hand. It is never
        shown on the order-tracking page, and it is not included in what we send to
        anyone other than the services listed below.
      </Section>

      <Section heading="Who else handles it">
        We use these services to run the shop. Each sees only what it needs:
        <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
          <li><strong>Airtable</strong> — stores orders and accounts</li>
          <li><strong>Upstash</strong> — stores sign-in sessions and rate limits</li>
          <li><strong>Resend</strong> — sends password reset emails</li>
          <li><strong>ToyyibPay</strong> — takes payment; card details go to them, never to us</li>
          <li><strong>Netlify</strong> — hosts the website</li>
        </ul>
      </Section>

      <Section heading="Data held outside Malaysia">
        Those services store and process data on servers outside Malaysia. By placing
        an order or creating an account you consent to your personal data being
        transferred and processed outside Malaysia for the purposes described above.
        If you would rather not, message us on WhatsApp and we will take your order
        by hand instead.
      </Section>

      <Section heading="How long we keep it">
        Order records are kept for as long as we may need them for accounting and for
        answering questions about past orders. Account details are kept until you ask
        us to delete the account. Sign-in sessions expire after seven days.
      </Section>

      <Section heading="Your rights">
        Under the PDPA you may ask us for a copy of the personal data we hold about
        you, ask us to correct it if it is wrong, ask us to delete your account, or
        withdraw your consent to us using it. Message us on WhatsApp and we will
        action it. There is no charge.
      </Section>

      <Section heading="Security">
        Passwords are hashed with bcrypt and never stored in a readable form.
        Authenticator secrets are encrypted. The site is served over HTTPS only, and
        the session cookie cannot be read by JavaScript. No system is perfect, but we
        do not cut corners on this.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid var(--border-panel)", margin: "44px 0 34px" }} />

      <h2
        style={{
          margin: "0 0 6px",
          fontWeight: 400,
          fontSize: 22,
          color: "var(--text-heading)",
        }}
      >
        Notis Privasi
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 26px" }}>
        Versi Bahasa Malaysia
      </p>

      <Section heading="Siapa kami">
        Cubelle ialah perniagaan kotak hadiah kecil yang membakar dan menghantar dari
        Kuantan, Pahang. Hubungi kami di WhatsApp{" "}
        <a href="https://wa.me/60106509189" target="_blank" rel="noreferrer" style={{ color: "var(--accent-text)" }}>
          +60 10-650 9189
        </a>{" "}
        mengenai apa-apa dalam notis ini.
      </Section>

      <Section heading="Maklumat yang kami kumpul">
        Semasa anda membuat pesanan: nama, alamat e-mel dan nombor telefon anda; nama
        dan alamat penghantaran penerima; mesej yang anda mahu kami tulis pada kad;
        butiran pesanan, tarikh penghantaran dan jumlah bayaran.
        <br />
        <br />
        Jika anda membuka akaun: alamat e-mel anda, kata laluan anda (disimpan sebagai
        cincangan bcrypt sahaja — kami tidak boleh membacanya), dan jika anda
        menghidupkan pengesahan dua faktor, rahsia pengesah yang disulitkan serta kod
        sandaran yang dicincang.
        <br />
        <br />
        Kami turut merekodkan alamat IP anda seketika semasa log masuk, penetapan
        semula kata laluan atau carian pesanan, semata-mata untuk mengehadkan
        percubaan berulang. Kami tidak menggunakan penjejak pengiklanan atau analitik.
      </Section>

      <Section heading="Tujuan pengumpulan">
        Untuk membakar dan menghantar pesanan anda, membolehkan anda menjejakinya,
        menghubungi anda mengenainya, menerima bayaran, mengurus akaun anda, dan
        melindungi laman ini daripada penyalahgunaan automatik. Kami tidak menjual
        data anda.
      </Section>

      <Section heading="Pihak lain yang mengendalikannya">
        Airtable (menyimpan pesanan dan akaun), Upstash (sesi log masuk), Resend
        (e-mel penetapan semula kata laluan), ToyyibPay (pembayaran — butiran kad
        pergi kepada mereka, bukan kepada kami), dan Netlify (hos laman web).
      </Section>

      <Section heading="Data di luar Malaysia">
        Perkhidmatan tersebut menyimpan dan memproses data di pelayan di luar
        Malaysia. Dengan membuat pesanan atau membuka akaun, anda bersetuju data
        peribadi anda dipindahkan dan diproses di luar Malaysia bagi tujuan yang
        dinyatakan di atas. Jika anda tidak bersetuju, hubungi kami di WhatsApp dan
        kami akan mengambil pesanan anda secara manual.
      </Section>

      <Section heading="Hak anda">
        Di bawah APDP 2010, anda boleh meminta salinan data peribadi yang kami
        simpan, meminta pembetulan jika ia salah, meminta akaun anda dipadam, atau
        menarik balik persetujuan anda. Hubungi kami di WhatsApp dan kami akan
        uruskan. Tiada caj dikenakan.
      </Section>
    </LegalPage>
  );
}
