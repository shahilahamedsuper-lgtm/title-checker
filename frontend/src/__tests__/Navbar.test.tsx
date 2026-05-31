import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ThemeProvider } from '../context/ThemeContext';

function renderNavbar(onHamburgerClick = vi.fn()) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Navbar onHamburgerClick={onHamburgerClick} />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  it('renders the hamburger button', () => {
    renderNavbar();
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i });
    expect(hamburger).toBeTruthy();
  });

  it('hamburger button has md:hidden class (hidden on desktop)', () => {
    renderNavbar();
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i });
    expect(hamburger.className).toContain('md:hidden');
  });

  it('calls onHamburgerClick when hamburger is clicked', async () => {
    const handler = vi.fn();
    renderNavbar(handler);
    const hamburger = screen.getByRole('button', { name: /open navigation menu/i });
    hamburger.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('renders the notifications button', () => {
    renderNavbar();
    const notif = screen.getByRole('button', { name: /notifications/i });
    expect(notif).toBeTruthy();
  });

  it('renders the user profile button', () => {
    renderNavbar();
    const profile = screen.getByRole('button', { name: /user profile/i });
    expect(profile).toBeTruthy();
  });

  it('applies sticky positioning class', () => {
    const { container } = renderNavbar();
    const header = container.querySelector('header');
    expect(header?.className).toContain('sticky');
    expect(header?.className).toContain('top-0');
  });
});
