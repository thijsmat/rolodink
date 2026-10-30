// This host only serves the API (/api/*). The root is not a page to index; it
// stays a plain 200 so anything that pings it keeps working, and it points
// people to the website.
export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '4rem 1.5rem', maxWidth: '40rem', margin: '0 auto' }}>
      <h1>Rolodink API</h1>
      <p>
        This address serves the API behind the Rolodink browser extension. The website is at{' '}
        <a href="https://rolodink.app">rolodink.app</a>.
      </p>
    </main>
  );
}
