import { useEffect, useMemo, useState } from 'react';
import type { Butterfly } from '../types/models';
import { parseDescription, isEmptyQuery } from '../lib/idguide/parse';
import { scoreSpeciesList, type FeatureEvidence } from '../lib/idguide/score';
import styles from './IdGuide.module.css';

interface Props {
  species: Butterfly[];
  /** Jump to the Log tab with this species queued into the draft. */
  onLogSpecies: (species: Butterfly) => void;
  /** Open the detail panel for a species (drives a /identify/<slug> URL). */
  onShowSpecies: (species: Butterfly) => void;
}

const EXAMPLES = [
  'small orange butterfly with dark spots, chalk downland, July',
  'big yellow one in the garden in spring, shaped like a leaf',
  'brown with eyespots in a meadow in August',
  'black and white marbled, grassland, midsummer',
];

const INITIAL_VISIBLE = 6;

const FEATURE_LABELS: Record<FeatureEvidence['feature'], string> = {
  months: 'time',
  colours: 'colour',
  size: 'size',
  habitats: 'habitat',
  markings: 'markings',
};

function EvidenceChips({ evidence }: { evidence: FeatureEvidence[] }): React.ReactElement {
  return (
    <ul className={styles.evidence}>
      {evidence.map((e) => (
        <li key={e.feature} className={styles.chip} data-matched={e.matched} title={FEATURE_LABELS[e.feature]}>
          <span className={styles.tick} aria-hidden="true">
            {e.matched ? '✓' : '✗'}
          </span>
          {e.matched ? e.detail.join(', ') : e.asked.join(', ')}
        </li>
      ))}
    </ul>
  );
}

export function IdGuide({ species, onLogSpecies, onShowSpecies }: Props): React.ReactElement {
  const [text, setText] = useState('');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const bySciName = useMemo(() => {
    const map = new Map<string, Butterfly>();
    for (const s of species) map.set(s.scientificName, s);
    return map;
  }, [species]);

  const { query, understood, allResults } = useMemo(() => {
    const parsed = parseDescription(text);
    if (isEmptyQuery(parsed.query)) {
      return { query: parsed.query, understood: parsed.understood, allResults: [] };
    }
    return { query: parsed.query, understood: parsed.understood, allResults: scoreSpeciesList(parsed.query) };
  }, [text]);

  // A fresh description starts the suggestion list over.
  useEffect(() => {
    setDismissed(new Set());
    setVisible(INITIAL_VISIBLE);
  }, [text]);

  const hasQuery = !isEmptyQuery(query);
  const kept = allResults.filter((m) => !dismissed.has(m.scientificName));
  const shown = kept.slice(0, visible);
  const remaining = kept.length - shown.length;

  const dismiss = (scientificName: string): void => {
    setDismissed((prev) => new Set(prev).add(scientificName));
  };

  return (
    <div className={styles.guide}>
      <p className={styles.intro}>
        Describe what you saw — colour, size, when, where, any markings — and Flutterby suggests
        which British butterfly it might be. Matching happens entirely on your device.
      </p>

      <textarea
        className={styles.input}
        rows={3}
        placeholder="e.g. small orange butterfly with dark spots on chalk downland in July"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Describe the butterfly"
      />

      {!text.trim() && (
        <div className={styles.examples}>
          <span className={styles.examplesLabel}>Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className={styles.example} onClick={() => setText(ex)}>
              {ex}
            </button>
          ))}
        </div>
      )}

      {text.trim() && !hasQuery && (
        <p className={styles.noParse}>
          Couldn't pick out any features yet. Try naming a colour, a month or season, the habitat,
          or markings like "spots" or "eyespots".
        </p>
      )}

      {hasQuery && (
        <>
          <p className={styles.understood}>
            Matching on:{' '}
            {understood.map((u, i) => (
              <span key={i} className={styles.understoodTag}>
                {u}
              </span>
            ))}
          </p>

          {shown.length === 0 ? (
            <p className={styles.noParse}>No more matches — try different details.</p>
          ) : (
            <ol className={styles.results}>
              {shown.map((match) => {
                const butterfly = bySciName.get(match.scientificName);
                return (
                  <li key={match.scientificName} className={styles.result}>
                    <button
                      type="button"
                      className={styles.media}
                      onClick={() => butterfly && onShowSpecies(butterfly)}
                      aria-label={`More about ${butterfly?.commonName ?? match.scientificName}`}
                    >
                      {butterfly?.imageUrl ? (
                        <img
                          className={styles.image}
                          src={butterfly.imageUrl}
                          alt={butterfly.commonName}
                          loading="lazy"
                        />
                      ) : (
                        <span className={styles.placeholder} aria-hidden="true">
                          🦋
                        </span>
                      )}
                      <span className={styles.score} data-strong={match.score >= 70}>
                        {match.score}%
                      </span>
                    </button>

                    <div className={styles.body}>
                      <button
                        type="button"
                        className={styles.nameButton}
                        onClick={() => butterfly && onShowSpecies(butterfly)}
                      >
                        {butterfly?.commonName ?? match.scientificName}
                      </button>
                      <p className={styles.scientific}>{match.scientificName}</p>
                      <EvidenceChips evidence={match.evidence} />
                    </div>

                    <div className={styles.actions}>
                      {butterfly && (
                        <button
                          type="button"
                          className={styles.logButton}
                          onClick={() => onLogSpecies(butterfly)}
                        >
                          Log this
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.dismiss}
                        onClick={() => dismiss(match.scientificName)}
                      >
                        Not this
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {remaining > 0 && (
            <button
              type="button"
              className={styles.more}
              onClick={() => setVisible((v) => v + INITIAL_VISIBLE)}
            >
              Show more options ({remaining} left)
            </button>
          )}

          <p className={styles.disclaimer}>
            Suggestions only — always confirm from wing patterns and a field guide before recording.
          </p>
        </>
      )}
    </div>
  );
}
