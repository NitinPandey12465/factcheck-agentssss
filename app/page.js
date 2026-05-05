'use client';

import { useState, useRef, useCallback } from 'react';

const VERDICT_CONFIG = {
  VERIFIED: {
    color: '#00ff88',
    bg: 'rgba(0,255,136,0.06)',
    border: 'rgba(0,255,136,0.2)',
    icon: '✓',
    label: 'VERIFIED',
  },
  INACCURATE: {
    color: '#ffaa00',
    bg: 'rgba(255,170,0,0.06)',
    border: 'rgba(255,170,0,0.2)',
    icon: '⚠',
    label: 'INACCURATE',
  },
  FALSE: {
    color: '#ff4455',
    bg: 'rgba(255,68,85,0.06)',
    border: 'rgba(255,68,85,0.2)',
    icon: '✕',
    label: 'FALSE',
  },
  UNVERIFIED: {
    color: '#888888',
    bg: 'rgba(136,136,136,0.06)',
    border: 'rgba(136,136,136,0.2)',
    icon: '?',
    label: 'UNVERIFIED',
  },
};

function StatBadge({ count, label, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '4px', padding: '16px 24px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', minWidth: '80px',
    }}>
      <span style={{ fontSize: '28px', fontWeight: '800', color, lineHeight: 1 }}>{count}</span>
      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{label}</span>
    </div>
  );
}

function ClaimCard({ item, index }) {
  const [open, setOpen] = useState(false);
  const cfg = VERDICT_CONFIG[item.verdict] || VERDICT_CONFIG.UNVERIFIED;

  return (
    <div
      style={{
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: '12px', overflow: 'hidden',
        animation: `fadeUp 0.4s ease ${index * 0.06}s both`,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '14px',
          padding: '18px 20px', cursor: 'pointer',
        }}
      >
        {/* Verdict badge */}
        <div style={{
          flexShrink: 0, width: '32px', height: '32px',
          borderRadius: '8px', background: cfg.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#000', fontWeight: '800', fontSize: '14px',
        }}>
          {cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.14em', color: cfg.color, fontWeight: '600',
            }}>
              {cfg.label}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              CLAIM #{String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', fontWeight: '500' }}>
            {item.claim}
          </p>
        </div>

        <div style={{
          flexShrink: 0, color: 'var(--text-muted)', fontSize: '18px',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          ⌄
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{
          borderTop: `1px solid ${cfg.border}`,
          padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: '8px' }}>ANALYSIS</div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', opacity: 0.9 }}>{item.explanation}</p>
          </div>

          {item.corrected_fact && (
            <div style={{
              padding: '12px 16px', background: 'rgba(232,255,0,0.05)',
              border: '1px solid rgba(232,255,0,0.15)', borderRadius: '8px',
            }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: '#e8ff00', marginBottom: '6px' }}>CORRECT FACT</div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>{item.corrected_fact}</p>
            </div>
          )}

          {item.sources && item.sources.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: '8px' }}>SOURCES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {item.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontSize: '12px', color: '#60a5fa', textDecoration: 'none',
                      fontFamily: 'var(--font-mono)',
                      padding: '6px 10px', background: 'rgba(96,165,250,0.06)',
                      borderRadius: '6px', border: '1px solid rgba(96,165,250,0.15)',
                      wordBreak: 'break-all',
                    }}
                  >
                    <span>↗</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {src.title || src.url}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UploadZone({ onFile, loading }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      style={{
        border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border-light)'}`,
        borderRadius: '16px',
        padding: '60px 40px',
        textAlign: 'center',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        background: drag ? 'rgba(232,255,0,0.03)' : 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corner accents */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: pos.includes('top') ? 0 : 'auto',
          bottom: pos.includes('bottom') ? 0 : 'auto',
          left: pos.includes('left') ? 0 : 'auto',
          right: pos.includes('right') ? 0 : 'auto',
          width: '16px', height: '16px',
          borderTop: pos.includes('top') ? '2px solid var(--accent)' : 'none',
          borderBottom: pos.includes('bottom') ? '2px solid var(--accent)' : 'none',
          borderLeft: pos.includes('left') ? '2px solid var(--accent)' : 'none',
          borderRight: pos.includes('right') ? '2px solid var(--accent)' : 'none',
          opacity: drag ? 1 : 0,
          transition: 'opacity 0.2s',
        }} />
      ))}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />

      <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>⬆</div>
      <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
        Drop your PDF here
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
        or click to browse — PDF files only
      </div>
    </div>
  );
}

function ProcessingScreen({ stage }) {
  const stages = [
    { id: 'extract', label: 'Extracting text from PDF', icon: '📄' },
    { id: 'identify', label: 'Identifying claims & statistics', icon: '🔍' },
    { id: 'search', label: 'Searching live web sources', icon: '🌐' },
    { id: 'verify', label: 'Verifying each claim', icon: '⚡' },
    { id: 'report', label: 'Generating truth report', icon: '📊' },
  ];

  const currentIdx = stages.findIndex(s => s.id === stage);

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      {/* Animated scanner */}
      <div style={{
        width: '80px', height: '80px', margin: '0 auto 32px',
        position: 'relative',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          border: '2px solid var(--border)',
          position: 'absolute',
        }} />
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: 'var(--accent)',
          position: 'absolute',
          animation: 'spin-slow 1s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '28px',
        }}>
          {stages[currentIdx]?.icon || '⚡'}
        </div>
      </div>

      <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
        Analyzing Document
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '32px' }}>
        {stages[currentIdx]?.label || 'Processing...'}
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '320px', margin: '0 auto', textAlign: 'left' }}>
        {stages.map((s, i) => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            opacity: i > currentIdx ? 0.3 : 1,
            transition: 'opacity 0.3s',
          }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
              background: i < currentIdx ? 'var(--verified)' : i === currentIdx ? 'var(--accent)' : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: '#000', fontWeight: '800',
              transition: 'background 0.3s',
            }}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '13px', color: i === currentIdx ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const handleFile = (f) => {
    setFile(f);
    setResults(null);
    setError('');
  };

  const handleVerify = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      setStage('extract');

      const res = await fetch('/api/verify', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Verification failed');
      }

      // Stream stage updates via SSE or just wait for result
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Check your API keys.');
    } finally {
      setLoading(false);
      setStage('');
    }
  };

  // Simulate stage updates while waiting
  useState(() => {
    if (!loading) return;
    const stages = ['extract', 'identify', 'search', 'verify', 'report'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % stages.length;
      setStage(stages[i]);
    }, 3000);
    return () => clearInterval(interval);
  });

  const filteredResults = results?.claims?.filter(c =>
    filter === 'ALL' ? true : c.verdict === filter
  ) || [];

  const stats = results ? {
    total: results.claims.length,
    verified: results.claims.filter(c => c.verdict === 'VERIFIED').length,
    inaccurate: results.claims.filter(c => c.verdict === 'INACCURATE').length,
    false: results.claims.filter(c => c.verdict === 'FALSE').length,
    unverified: results.claims.filter(c => c.verdict === 'UNVERIFIED').length,
  } : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px', position: 'sticky', top: 0,
        background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', background: 'var(--accent)',
            borderRadius: '6px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '14px', fontWeight: '900', color: '#000',
          }}>T</div>
          <span style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.02em' }}>TruthLayer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Powered by Claude AI + Tavily
          </span>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--verified)', boxShadow: '0 0 8px var(--verified)',
            animation: 'pulse-glow 2s ease infinite',
          }} />
        </div>
      </header>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', border: '1px solid var(--border-light)',
            borderRadius: '100px', marginBottom: '24px',
            fontSize: '11px', fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)', letterSpacing: '0.1em',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            AI-POWERED FACT VERIFICATION
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: '800',
            lineHeight: '1.05', letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}>
            Every Claim.
            <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #00ff88 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Verified.</span>
          </h1>

          <p style={{
            fontSize: '16px', color: 'var(--text-secondary)',
            maxWidth: '500px', margin: '0 auto', lineHeight: '1.7',
          }}>
            Upload any PDF and our AI will extract every factual claim, cross-reference against live web data, and flag inaccuracies in seconds.
          </p>
        </div>

        {/* Upload Card */}
        {!loading && !results && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '32px',
            animation: 'fadeUp 0.5s ease',
          }}>
            {!file ? (
              <UploadZone onFile={handleFile} loading={loading} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* File preview */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 20px', background: 'var(--bg-card2)',
                  border: '1px solid var(--border-light)', borderRadius: '12px',
                }}>
                  <div style={{
                    width: '40px', height: '48px', background: 'rgba(232,255,0,0.1)',
                    border: '1px solid rgba(232,255,0,0.2)', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', flexShrink: 0,
                  }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {(file.size / 1024).toFixed(1)} KB · PDF
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: '18px', padding: '4px',
                    }}
                  >×</button>
                </div>

                <button
                  onClick={handleVerify}
                  style={{
                    width: '100%', padding: '16px',
                    background: 'var(--accent)', color: '#000',
                    border: 'none', borderRadius: '12px',
                    fontSize: '15px', fontWeight: '800',
                    cursor: 'pointer', letterSpacing: '0.02em',
                    fontFamily: 'var(--font-body)',
                    transition: 'opacity 0.2s, transform 0.1s',
                  }}
                  onMouseEnter={e => e.target.style.opacity = '0.9'}
                  onMouseLeave={e => e.target.style.opacity = '1'}
                >
                  ⚡ Verify All Claims
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '40px 32px',
          }}>
            <ProcessingScreen stage={stage} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--false-bg)', border: '1px solid var(--false-border)',
            borderRadius: '12px', padding: '16px 20px', marginTop: '16px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ color: 'var(--false)', fontSize: '18px' }}>✕</span>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--false)', marginBottom: '4px' }}>Verification Failed</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{error}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ animation: 'fadeUp 0.5s ease' }}>
            {/* Stats */}
            <div style={{
              display: 'flex', gap: '12px', marginBottom: '32px',
              flexWrap: 'wrap', justifyContent: 'center',
            }}>
              <StatBadge count={stats.total} label="Total Claims" color="var(--text-primary)" />
              <StatBadge count={stats.verified} label="Verified" color="var(--verified)" />
              <StatBadge count={stats.inaccurate} label="Inaccurate" color="var(--inaccurate)" />
              <StatBadge count={stats.false} label="False" color="var(--false)" />
              {stats.unverified > 0 && <StatBadge count={stats.unverified} label="Unverified" color="var(--text-secondary)" />}
            </div>

            {/* Truth score */}
            {results.claims.length > 0 && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '20px 24px', marginBottom: '24px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.1em' }}>TRUTH SCORE</div>
                  <div style={{
                    height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      width: `${stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, var(--verified), #00cc88)',
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
                <div style={{
                  fontSize: '28px', fontWeight: '800',
                  color: stats.verified / stats.total > 0.7 ? 'var(--verified)' : stats.verified / stats.total > 0.4 ? 'var(--inaccurate)' : 'var(--false)',
                }}>
                  {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                </div>
              </div>
            )}

            {/* Summary */}
            {results.summary && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px 20px', marginBottom: '24px',
              }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.1em' }}>DOCUMENT SUMMARY</div>
                <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-primary)', opacity: 0.9 }}>{results.summary}</p>
              </div>
            )}

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['ALL', 'VERIFIED', 'INACCURATE', 'FALSE', 'UNVERIFIED'].map(f => {
                const count = f === 'ALL' ? stats.total :
                  f === 'VERIFIED' ? stats.verified :
                  f === 'INACCURATE' ? stats.inaccurate :
                  f === 'FALSE' ? stats.false : stats.unverified;
                if (count === 0 && f !== 'ALL') return null;
                const cfg = VERDICT_CONFIG[f] || { color: 'var(--text-primary)', border: 'var(--border)' };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '600',
                      letterSpacing: '0.1em',
                      border: filter === f ? `1px solid ${f === 'ALL' ? 'var(--accent)' : cfg.color}` : '1px solid var(--border)',
                      background: filter === f ? (f === 'ALL' ? 'rgba(232,255,0,0.08)' : cfg.bg) : 'transparent',
                      color: filter === f ? (f === 'ALL' ? 'var(--accent)' : cfg.color) : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>

            {/* Claims list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  No claims in this category
                </div>
              ) : (
                filteredResults.map((item, i) => (
                  <ClaimCard key={i} item={item} index={i} />
                ))
              )}
            </div>

            {/* Try again */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={() => { setResults(null); setFile(null); }}
                style={{
                  padding: '12px 28px', background: 'transparent',
                  border: '1px solid var(--border-light)', color: 'var(--text-secondary)',
                  borderRadius: '10px', cursor: 'pointer', fontSize: '14px',
                  fontFamily: 'var(--font-body)', fontWeight: '600',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--text-secondary)'; e.target.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                ↑ Verify another document
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '24px',
        textAlign: 'center', color: 'var(--text-muted)',
        fontSize: '12px', fontFamily: 'var(--font-mono)',
      }}>
        TruthLayer · Built for CogCulture Assessment · Powered by Claude + Tavily
      </footer>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
