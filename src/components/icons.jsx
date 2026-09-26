function Icon({ size = 20, className = "", children }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function ArrowRightIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </Icon>
  );
}

export function LostIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="m15 15 4.5 4.5" />
      <path d="M8.5 8.5 10 6.8m4.2 1.8-1.6 1.4" />
    </Icon>
  );
}

export function FoundIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 13.5 9.5 18 19 7.5" />
    </Icon>
  );
}

export function ReportIcon(props) {
  return (
    <Icon {...props}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </Icon>
  );
}

export function MatchIcon(props) {
  return (
    <Icon {...props}>
      <path d="m9 12 1.7 1.7 3-3" />
      <path d="M4 8.5A5.5 5.5 0 0 1 9.5 3c1.6 0 3 .7 4 1.8a4.8 4.8 0 0 1 6 4.6 4.8 4.8 0 0 1-2.8 4.4L12 20l-4.7-6.2" />
      <path d="M8.5 10.5h.01M15.5 10.5h.01" />
    </Icon>
  );
}

export function VerifyIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3 4.5 6v5c0 4.5 3 8.2 7.5 10 4.5-1.8 7.5-5.5 7.5-10V6L12 3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-4.5" />
    </Icon>
  );
}

export function RecoverIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3 8h4V4" />
      <path d="M3.7 14a9 9 0 1 0 1.2-6.2L3 8" />
    </Icon>
  );
}

export function CampusIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3 21h18M5 21V8l7-5 7 5v13" />
      <path d="M9 21v-5h6v5M9 9h.01M15 9h.01M12 12h.01" />
    </Icon>
  );
}

export function ShieldIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3 4.5 6v5c0 4.5 3 8.2 7.5 10 4.5-1.8 7.5-5.5 7.5-10V6L12 3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-4.5" />
    </Icon>
  );
}

export function PinIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

export function CalendarIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </Icon>
  );
}

export function UserIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Icon>
  );
}

export function ClockIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}