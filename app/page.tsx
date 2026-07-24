const journeySteps = [
  ["01", "Descubre", "El camino revela una puerta antigua."],
  ["02", "Se acerca", "La luz responde cuando el invitado avanza."],
  ["03", "Amigo", "La palabra secreta despierta el umbral."],
];

const featureItems = [
  ["Exploración", "Una experiencia móvil first con movimiento y atmósfera."],
  ["Interacción", "Cada gesto activa una respuesta mágica."],
  ["Revelación", "La invitación completa se abrirá cuando llegue el momento."],
];

export default function Home() {
  return (
    <main className="coming-soon-page" id="main-content">
      <section className="hero-panel" aria-labelledby="coming-soon-title">
        <div className="ornate-corner ornate-corner--tl" aria-hidden="true" />
        <div className="ornate-corner ornate-corner--tr" aria-hidden="true" />
        <div className="ornate-corner ornate-corner--bl" aria-hidden="true" />
        <div className="ornate-corner ornate-corner--br" aria-hidden="true" />

        <div className="hero-art" aria-hidden="true" />

        <header className="site-mark" aria-label="Gladiola y Jordi">
          <span className="monogram">G&amp;J</span>
          <span className="mark-line" />
          <span>Gladiola &amp; Jordi</span>
        </header>

        <div className="hero-copy">
          <p className="chapter">Invitación interactiva de boda</p>
          <h1 id="coming-soon-title">
            El Camino
            <span>Secreto</span>
          </h1>
          <div className="coming-soon" aria-label="Coming soon">
            Coming Soon
          </div>
          <p className="hero-lede">
            Hay puertas que no aparecen en ningún mapa. Muy pronto, los
            invitados de Gladiola y Jordi podrán cruzar el umbral y descubrir
            el inicio de una aventura.
          </p>
          <div className="secret-lock" aria-label="Palabra secreta">
            <span>Palabra del camino</span>
            <strong>amigo</strong>
          </div>
        </div>

        <aside className="phone-preview" aria-label="Vista previa móvil">
          <div className="phone-shell">
            <div className="phone-screen">
              <span className="phone-status">9:41</span>
              <span className="phone-monogram">G&amp;J</span>
              <p>Estás invitado a</p>
              <h2>Nuestra boda</h2>
              <span className="phone-date">Coming Soon</span>
              <button type="button">Despertar la puerta</button>
            </div>
          </div>
        </aside>

        <div className="journey-strip" aria-label="Fases de la experiencia">
          {journeySteps.map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="details-band" aria-labelledby="details-title">
        <div>
          <p className="chapter">El viaje del invitado</p>
          <h2 id="details-title">La invitación está despertando.</h2>
        </div>
        <div className="feature-list">
          {featureItems.map(([title, description]) => (
            <article key={title}>
              <span aria-hidden="true">✦</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="closing-line">
        <span>El Camino Secreto</span>
        <span aria-hidden="true">✦</span>
        <span>Nuestra historia comienza contigo</span>
      </footer>
    </main>
  );
}
