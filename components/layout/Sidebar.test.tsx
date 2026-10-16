import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SIDEBAR_COLLAPSED_KEY } from '@/lib/sidebar-state'
import { Sidebar } from './Sidebar'

const usePathnameMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, email: 'demo@example.com', nombre: 'Demo', created_at: '' } }),
}))

describe('Sidebar — navigation', () => {
  it('lists "Markowitz" between Resumen and Movimientos, linking to /markowitz', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    render(<Sidebar />)

    const links = screen.getAllByRole('link')
    expect(links.map(l => l.textContent)).toEqual(['Resumen', 'Markowitz', 'Movimientos', 'Ajustes'])
    expect(screen.getByRole('link', { name: 'Markowitz' })).toHaveAttribute('href', '/markowitz')
  })

  it('marks "Markowitz" as active on /markowitz', () => {
    usePathnameMock.mockReturnValue('/markowitz')
    render(<Sidebar />)

    expect(screen.getByRole('link', { name: 'Markowitz' })).toHaveClass('font-medium')
    expect(screen.getByRole('link', { name: 'Resumen' })).not.toHaveClass('font-medium')
  })
})

describe('Sidebar — collapsible', () => {
  function aside() {
    return screen.getByRole('complementary')
  }

  it('starts expanded with an "Contraer menú" toggle', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    render(<Sidebar />)

    const toggle = screen.getByRole('button', { name: 'Contraer menú' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(aside()).toHaveAttribute('data-collapsed', 'false')
    expect(screen.getByText('Garal Cartera v1.0')).toBeInTheDocument()
  })

  it('collapses to an icon rail: labels hidden visually, links keep their accessible names', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    render(<Sidebar />)

    fireEvent.click(screen.getByRole('button', { name: 'Contraer menú' }))

    expect(aside()).toHaveAttribute('data-collapsed', 'true')
    const toggle = screen.getByRole('button', { name: 'Expandir menú' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    for (const name of ['Resumen', 'Markowitz', 'Movimientos', 'Ajustes']) {
      const link = screen.getByRole('link', { name })
      expect(link).toHaveAttribute('title', name)
      expect(screen.getByText(name)).toHaveClass('lg:sr-only')
    }
    // Hidden on the desktop rail only; the mobile drawer keeps the full footer.
    expect(screen.getByText('Garal Cartera v1.0')).toHaveClass('lg:hidden')
    expect(screen.getByText('D')).toBeInTheDocument()
  })

  it('places the toggle above the navigation so it is visible without scrolling', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    render(<Sidebar />)

    const toggle = screen.getByRole('button', { name: 'Contraer menú' })
    const firstLink = screen.getByRole('link', { name: 'Resumen' })
    expect(toggle.compareDocumentPosition(firstLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the toggle as an icon only, in the header next to the user name', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    render(<Sidebar />)

    const toggle = screen.getByRole('button', { name: 'Contraer menú' })
    expect(toggle).toHaveTextContent('')
    expect(screen.queryByText('Contraer')).not.toBeInTheDocument()
    expect(toggle.parentElement).toContainElement(screen.getByText('Demo'))
  })

  it('stays pinned to the viewport on desktop so the toggle never scrolls away', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    render(<Sidebar />)

    expect(aside()).toHaveClass('lg:sticky', 'lg:top-0', 'lg:h-screen')
    expect(aside()).not.toHaveClass('lg:static')
  })

  it('expands again', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    render(<Sidebar />)

    fireEvent.click(screen.getByRole('button', { name: 'Contraer menú' }))
    fireEvent.click(screen.getByRole('button', { name: 'Expandir menú' }))

    expect(aside()).toHaveAttribute('data-collapsed', 'false')
    expect(screen.getByText('Resumen')).not.toHaveClass('lg:sr-only')
    expect(screen.getByText('Garal Cartera v1.0')).toBeInTheDocument()
  })

  it('keeps highlighting the active link while collapsed', () => {
    usePathnameMock.mockReturnValue('/markowitz')
    render(<Sidebar />)

    fireEvent.click(screen.getByRole('button', { name: 'Contraer menú' }))

    expect(screen.getByRole('link', { name: 'Markowitz' })).toHaveClass('font-medium')
    expect(screen.getByRole('link', { name: 'Resumen' })).not.toHaveClass('font-medium')
  })

  it('persists the state and restores it on remount', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    const first = render(<Sidebar />)
    fireEvent.click(screen.getByRole('button', { name: 'Contraer menú' }))
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe('true')
    first.unmount()

    render(<Sidebar />)

    expect(aside()).toHaveAttribute('data-collapsed', 'true')
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toBeInTheDocument()
  })

  it('still toggles when localStorage is unavailable', () => {
    usePathnameMock.mockReturnValue('/dashboard')
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!
    Object.defineProperty(window, 'localStorage', { value: undefined, configurable: true, writable: true })
    try {
      render(<Sidebar />)
      fireEvent.click(screen.getByRole('button', { name: 'Contraer menú' }))
      expect(aside()).toHaveAttribute('data-collapsed', 'true')
    } finally {
      Object.defineProperty(window, 'localStorage', original)
    }
  })
})
