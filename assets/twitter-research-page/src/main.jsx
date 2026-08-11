import React from 'react'
import { createRoot } from 'react-dom/client'
import { Tweet } from 'react-tweet'
import { research } from './research'
import './styles.css'

function TweetUnavailable() {
  return (
    <div className="tweet-unavailable" role="status">
      <strong>Unable to load this post here.</strong>
      <span>Use the “Open on X” link above to view it.</span>
    </div>
  )
}

function TweetCard({ tweet, highlighted = false }) {
  return (
    <article className={highlighted ? 'tweet-card highlighted' : 'tweet-card'}>
      <div className="tweet-label">
        <span>{tweet.label || tweet.author}</span>
        <a
          href={`https://x.com/i/status/${tweet.id}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${tweet.author}'s post on X`}
        >
          Open on X
        </a>
      </div>
      <div className="tweet-embed" data-theme="light">
        <Tweet
          id={tweet.id}
          components={{ TweetNotFound: TweetUnavailable }}
          onError={() => null}
        />
      </div>
    </article>
  )
}

function ReviewedPostList({ title, posts = [] }) {
  const [hasOpened, setHasOpened] = React.useState(false)

  function handleToggle(event) {
    if (event.currentTarget.open) {
      setHasOpened(true)
    }
  }

  return (
    <details className="reviewed-posts" onToggle={handleToggle}>
      <summary>
        <span>{title}</span>
        <span className="reviewed-count">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </span>
      </summary>
      {hasOpened &&
        (posts.length > 0 ? (
          <div className="reviewed-tweet-grid">
            {posts.map((post) => (
              <TweetCard
                key={post.id}
                tweet={{ ...post, label: post.note || post.author }}
              />
            ))}
          </div>
        ) : (
          <p className="reviewed-empty">No posts in this category.</p>
        ))}
    </details>
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

      <footer>
        <p className="selection-note">{research.selectionNote}</p>
        {research.reviewedPosts && (
          <section className="review-ledger" aria-labelledby="review-ledger-title">
            <p className="eyebrow">Research trail</p>
            <h2 id="review-ledger-title">Posts reviewed</h2>
            <p className="review-ledger-intro">
              {research.reviewedPosts.intro ||
                'These lists show how every public post considered in the research pass was classified. Open either list to inspect the complete set.'}
            </p>
            <ReviewedPostList
              title="Posts not classed as noise"
              posts={research.reviewedPosts.notNoise}
            />
            <ReviewedPostList
              title="Posts classed as noise"
              posts={research.reviewedPosts.noise}
            />
          </section>
        )}
      </footer>
    </main>
  )
}

document.title = research.title

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
