import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/lib/preferences'
import { VistaSection } from './VistaSection'

function renderVistaSection() {
  return render(
    <PreferencesProvider>
      <VistaSection />
    </PreferencesProvider>,
  )
}

describe('VistaSection — reflects current PreferencesContext state', () => {
  it('shows privacy off and density comfortable by default', () => {
    renderVistaSection()

    expect(screen.getByRole('switch', { name: /modo privacidad/i })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('tab', { name: 'Cómoda' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Compacta' })).toHaveAttribute('aria-selected', 'false')
  })
})

describe('VistaSection — toggling privacy', () => {
  it('clicking the privacy switch calls setPrivacy and flips aria-checked', () => {
    renderVistaSection()
    const toggle = screen.getByRole('switch', { name: /modo privacidad/i })

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})

describe('VistaSection — switching density', () => {
  it('clicking "Compacta" calls setDensity and updates the selected tab', () => {
    renderVistaSection()

    fireEvent.click(screen.getByRole('tab', { name: 'Compacta' }))

    expect(screen.getByRole('tab', { name: 'Compacta' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Cómoda' })).toHaveAttribute('aria-selected', 'false')
  })
})
