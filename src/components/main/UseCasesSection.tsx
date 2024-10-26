import * as React from 'react';
import clsx from 'clsx';
import { Section } from './Section';

import layout from '../../css/layout.module.css';
import styles from './UseCasesSection.module.css';

export const Quote: React.FC<{
  quote: string;
  attribution: string;
  profileUrl: string;
  profileAlt: string;
  logoUrl: string;
  logoAlt: string;
  linkUrl: string;
}> = ({ quote, attribution, profileUrl, profileAlt, logoUrl, logoAlt, linkUrl }) => (
  <div>
    <p className={styles.message}>{quote}</p>
    <div className={styles.attribution}>
      <img className={styles.picture} width={80} src={profileUrl} alt={profileAlt} />
      <div className={styles.attributionWrapper}>
        <p className={styles.title}>{attribution}</p>
        <a className={styles.logoLink} href={linkUrl} target="_blank">
          <img className={styles.logo} src={logoUrl} alt={logoAlt} />
        </a>
      </div>
    </div>
  </div>
);

export const UseCasesSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h2>What the Community is Saying</h2>
      <div className={clsx(layout.card2, styles.cardGrid)}>
        {/* <Quote
          attribution="Todd Berman, CTO"
          linkUrl="https://www.attentive.com/"
          logoAlt="Attentive"
          logoUrl="img/use-case-quotes/logo-attentive.svg"
          profileAlt="Todd Berman"
          profileUrl="img/use-case-quotes/profile-todd-berman.jpeg"
          quote="Lawme's visual programming environment is a game-changer. The visual nature of the tool, paired with how
          collaborative it is, allows us to create complex chains for AI agents in drastically less time than it would take
          in other environments. It's the best tool out there."
        /> */}
      </div>
    </Section>
  );
};
