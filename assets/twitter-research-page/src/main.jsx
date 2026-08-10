import React from 'react'
import { createRoot } from 'react-dom/client'
import { Tweet } from 'react-tweet'
import { research } from './research'
import './styles.css'

function TweetCard({ tweet, highlighted = false }) {
  return (
    <article className={highlighted ? 'tweet-card highlighted' : 'tweet-card'}>
      <div className="tweet-label">
        <span>{tweet.label || tweet.author}</span>
        <a href={`https://x.com/i/status/${tweet.id}`} target="_blank" rel="noreferrer">
          Open on X
        </a>
      </div>
      <div className="tweet-embed" data-theme="light">
        <Tweet id={tweet.id} />
      </div>
    </article>
  )
}

function App() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Twitter scan · {research.date}</p>
        <h1>{research.title}</h1>
        <p className="dek">{research.summary}</p>
        {research.pattern?.length > 0 && (
          <div className="pattern" aria-label="Repeated pattern">
            {research.pattern.map((step, index) => (
              <React.Fragment key={step}>
                {index > 0 && <b>→</b>}
                <span>{step}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {research.lead && (
        <section className="lead-section">
          <div className="section-heading">
            <p className="eyebrow">{research.lead.label}</p>
            <h2>{research.lead.author}</h2>
          </div>
          <TweetCard tweet={research.lead} highlighted />
        </section>
      )}

      {research.sections.map((section) => (
        <section key={section.title}>
          <div className="section-heading">
            <p className="eyebrow">{section.eyebrow}</p>
            <h2>{section.title}</h2>
          </div>
          <div className="tweet-grid">
            {section.tweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        </section>
      ))}

      <footer>{research.selectionNote}</footer>
    </main>
  )
}

document.title = research.title

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
