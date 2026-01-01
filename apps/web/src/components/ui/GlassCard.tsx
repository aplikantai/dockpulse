'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  accentColor?: string;
  hover?: boolean;
  onClick?: () => void;
}

/**
 * Glassmorphism Card Component
 * iOS-style card with blur effect and transparency
 */
export function GlassCard({
  children,
  className = '',
  accent = false,
  accentColor,
  hover = true,
  onClick,
}: GlassCardProps) {
  const accentStyle = accent
    ? { borderLeft: `4px solid ${accentColor || 'var(--color-accent)'}` }
    : {};

  return (
    <div
      className={`
        backdrop-blur-xl
        bg-white/70
        dark:bg-slate-900/70
        rounded-2xl
        border border-white/20
        shadow-lg shadow-black/5
        p-6
        ${hover ? 'transition-all hover:shadow-xl hover:bg-white/80' : ''}
        ${className}
      `}
      style={accentStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * Glass Card Header
 */
export function GlassCardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 pb-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Glass Card Title
 */
export function GlassCardTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

/**
 * Glass Card Content
 */
export function GlassCardContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/**
 * Glass Card Footer
 */
export function GlassCardFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
}
