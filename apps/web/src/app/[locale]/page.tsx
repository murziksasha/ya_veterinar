import { isLocale, TENANT_HEADER } from '@vetsync/shared';
import { notFound } from 'next/navigation';
import { t } from '@/i18n/messages';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }

  const other = localeParam === 'uk' ? 'en' : 'uk';

  return (
    <main className='auth-shell'>
      <section className='card auth-card'>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
            }}
          >
            {t(localeParam, 'product')}
          </span>
          <a
            href={`/${other}`}
            className='auth-switch'
            style={{ textDecoration: 'none', fontWeight: 600 }}
          >
            {other.toUpperCase()}
          </a>
        </header>

        <div>
          <h1>{t(localeParam, 'title')}</h1>
          <p
            style={{
              margin: '0.5rem 0 0',
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              lineHeight: 1.5,
            }}
          >
            {t(localeParam, 'body')}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '0.6rem',
            marginTop: '0.25rem',
          }}
        >
          <a
            href={`/${localeParam}/register`}
            className='btn btn-primary'
            style={{ textAlign: 'center', textDecoration: 'none' }}
          >
            {t(localeParam, 'register')}
          </a>
          <a
            href={`/${localeParam}/login`}
            className='btn btn-secondary'
            style={{ textAlign: 'center', textDecoration: 'none' }}
          >
            {t(localeParam, 'signIn')}
          </a>
        </div>

        <footer
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '0.75rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{t(localeParam, 'tenantHeader')}:</span>
          <code>{TENANT_HEADER}</code>
        </footer>
      </section>
    </main>
  );
}
