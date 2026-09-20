import React from 'react';
import { Link } from 'react-router-dom';
import { HiMail, HiLink } from 'react-icons/hi';

/**
 * How to actually reach a person.
 *
 * Shared by the team roster and the leader's join-request queue, because the
 * failure is the same in both places: you decide about somebody - accept the
 * invitation, approve the request - and then have no way to say a word to
 * them. Renders whatever fields are present, so a backend that withholds the
 * email simply shows one fewer link rather than breaking.
 */
export default function ContactLinks({ person, isSelf = false, className = 'mt-1.5' }) {
  const links = [
    person.email     && { k: 'email',     href: `mailto:${person.email}`, label: person.email, Icon: HiMail, external: false },
    person.github    && { k: 'github',    href: person.github,    label: 'GitHub',    Icon: HiLink, external: true },
    person.linkedin  && { k: 'linkedin',  href: person.linkedin,  label: 'LinkedIn',  Icon: HiLink, external: true },
    person.portfolio && { k: 'portfolio', href: person.portfolio, label: 'Portfolio', Icon: HiLink, external: true },
  ].filter(Boolean);

  if (links.length === 0) {
    return (
      <p className={`text-xs text-gray-400 ${className}`}>
        {isSelf
          ? <>No contact links yet — <Link to="/profile" className="text-primary-600 hover:underline">add them to your profile</Link>.</>
          : 'No contact links shared.'}
      </p>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      {links.map(({ k, href, label, Icon, external }) => (
        <a
          key={k}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline break-all"
        >
          <Icon className="h-3 w-3 flex-shrink-0" />{label}
        </a>
      ))}
    </div>
  );
}
