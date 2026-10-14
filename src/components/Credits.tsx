import { content } from '../content';

interface Props {
  /** Mostra também o link do portfólio (usado na tela final). */
  portfolio?: boolean;
}

export function Credits({ portfolio = false }: Props) {
  return (
    <footer className="credits">
      <a href={content.credits.href} target="_blank" rel="noopener noreferrer">
        {content.credits.label}
      </a>
      {portfolio && (
        <a className="credits__portfolio" href={content.credits.portfolioHref} target="_blank" rel="noopener noreferrer">
          {content.credits.portfolioLabel}
        </a>
      )}
    </footer>
  );
}
