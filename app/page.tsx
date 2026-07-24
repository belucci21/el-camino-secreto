const guestJourney = [
  ["01", "Descubre", "El paisaje despierta con niebla, agua y una puerta lejana."],
  ["02", "Se acerca", "La cámara avanza hacia el umbral entre destellos dorados."],
  ["03", "Escribe “amigo”", "La palabra narrativa activa la respuesta de la piedra."],
  ["04", "La puerta despierta", "Los símbolos inventados se iluminan sin revelar aún la invitación."],
  ["05", "La puerta se abre", "La luz cruza el bosque y anuncia el acceso."],
  ["06", "Comienza la boda", "La historia de Gladiola y Jordi aparece dentro del mismo universo."],
];

const phases = [
  {
    number: "01",
    title: "Descubrimiento",
    subtitle: "El llamado",
    copy: "Una entrada misteriosa, móvil first, pensada para que cada invitado sienta que encontró algo secreto.",
  },
  {
    number: "02",
    title: "La palabra secreta",
    subtitle: "La prueba",
    copy: "El umbral no se desbloquea como una contraseña: responde como un objeto encantado a la palabra “amigo”.",
  },
  {
    number: "03",
    title: "La revelación",
    subtitle: "El acceso",
    copy: "La invitación final no será una página aparte; será la consecuencia natural de cruzar la puerta.",
  },
];

const openingSequence = [
  "Acercamiento",
  "Destellos mágicos",
  "La puerta responde",
  "Apertura",
  "Bienvenida",
];

export default function Home() {
  return (
    <main className="teaser-page" id="main-content">
      <section className="proposal-hero" aria-labelledby="coming-soon-title">
        <div className="hero-frame" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <header className="proposal-header" aria-label="Gladiola y Jordi">
          <div className="proposal-mark">
            <span className="proposal-monogram">G&amp;J</span>
            <span className="proposal-names">Gladiola &amp; Jordi</span>
          </div>
          <nav className="proposal-nav" aria-label="Secciones del adelanto">
            <a href="#viaje">El viaje</a>
            <a href="#fases">Las fases</a>
            <a href="#apertura">La apertura</a>
          </nav>
        </header>

        <div className="hero-content">
          <div className="hero-copy">
            <p className="proposal-label">Invitación interactiva de boda</p>
            <h1 id="coming-soon-title">
              El Camino{" "}
              <span>Secreto</span>
            </h1>
            <p className="coming-soon-badge" aria-label="COMING SOON">
              COMING SOON
            </p>
            <p className="hero-lede">
              Muy pronto, los invitados de Gladiola y Jordi cruzarán una puerta
              antigua, descubrirán una palabra escondida y entrarán en el inicio
              de una aventura creada solo para esta boda.
            </p>
            <div className="hero-actions" aria-label="Estado del camino">
              <span className="stone-pill">La palabra del camino: amigo</span>
              <span className="release-note">El umbral se abrirá pronto</span>
            </div>
          </div>

          <aside className="invitation-device" aria-label="Vista previa móvil de la invitación">
            <div className="phone-frame">
              <div className="phone-glass">
                <span className="phone-time">9:41</span>
                <span className="phone-mark">G&amp;J</span>
                <p>Solo quienes conocen la palabra podrán entrar.</p>
                <div className="phone-door" aria-hidden="true">
                  <span />
                </div>
                <strong>COMING SOON</strong>
                <span className="phone-button">Despertar la puerta</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="hero-footer" aria-label="Promesa de la experiencia">
          <span>3 fases</span>
          <span>Interactiva y cinematográfica</span>
          <span>Diseñada para emocionar desde el primer instante</span>
        </div>
      </section>

      <section className="journey-section" id="viaje" aria-labelledby="journey-title">
        <div className="section-heading">
          <p className="proposal-label">El viaje del invitado</p>
          <h2 id="journey-title">Cada paso revela una parte de la historia.</h2>
        </div>
        <div className="journey-track">
          {guestJourney.map(([number, title, copy]) => (
            <article className="journey-card" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="phases-section" id="fases" aria-labelledby="phases-title">
        <div className="section-heading">
          <p className="proposal-label">Las tres fases</p>
          <h2 id="phases-title">No será una invitación que se lee. Será una puerta que se cruza.</h2>
        </div>
        <div className="phase-grid">
          {phases.map((phase) => (
            <article className="phase-card" key={phase.number}>
              <span className="phase-number">{phase.number}</span>
              <div className="phase-phone" aria-hidden="true">
                <span />
                <strong>{phase.title}</strong>
              </div>
              <h3>{phase.title}</h3>
              <p className="phase-subtitle">{phase.subtitle}</p>
              <p>{phase.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="opening-section" id="apertura" aria-labelledby="opening-title">
        <div className="opening-copy">
          <p className="proposal-label">Animaciones que cuentan</p>
          <h2 id="opening-title">La magia no será decoración: será la forma de avanzar.</h2>
          <p>
            La primera versión pública mantiene el misterio. La experiencia
            completa conservará los datos de boda pendientes y usará la puerta,
            la palabra y la revelación como hilo narrativo.
          </p>
        </div>
        <ol className="opening-steps">
          {openingSequence.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <footer className="proposal-footer">
        <span>El Camino Secreto</span>
        <span aria-hidden="true">✦</span>
        <span>Nuestra historia comienza contigo</span>
      </footer>
    </main>
  );
}
