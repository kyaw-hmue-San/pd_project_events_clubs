import { expect, test, type Page, type Locator } from "@playwright/test"
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { testEnvironment } from '../scripts/test-environment.mjs'

test('public privacy notice opens without a session or API access and is linked before sign-in', async ({ page }) => {
  const accountRequests: string[] = []
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) accountRequests.push(request.url()) })
  await page.goto('/#privacy')
  const heading = page.getByRole('heading', { name: 'Privacy and data use', exact: true })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
  await expect(page.getByRole('link', { name: '6731503062@lamduan.mfu.ac.th', exact: true })).toHaveAttribute('href', /^mailto:/)
  await expect(page.getByText(/automatic expiry is not implemented/i)).toBeVisible()
  await page.setViewportSize({ width: 360, height: 800 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  expect(accountRequests).toEqual([])
  await page.getByRole('link', { name: 'Open application', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Continue with Google', exact: true })).toBeVisible()
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('link', { name: 'Privacy and data use (opens in a new tab)', exact: true }).click()
  const notice = await popupPromise
  await expect(notice.getByRole('heading', { name: 'Privacy and data use', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google', exact: true })).toBeVisible()
  await notice.close()
})

async function publishTicketEvent(page: Page, prefix = 'Ticket workshop', signedIn = false, description = 'Isolated QR attendance browser verification.') {
  if (!signedIn) await login(page, 'organizer')
  await page.getByRole('navigation').getByRole('button', { name: 'Create activity', exact: true }).click()
  const title = `${prefix} ${Date.now()}`
  await page.getByLabel('Activity title', { exact: true }).fill(title)
  await page.getByLabel('Description', { exact: true }).fill(description)
  await page.getByLabel('Location', { exact: true }).fill('Ticket Test Hall')
  await page.getByLabel('Date', { exact: true }).fill('2027-03-12')
  await page.getByLabel('Start time', { exact: true }).fill('10:00')
  await page.getByRole('button', { name: 'Publish activity', exact: true }).click()
  await expect(page.getByRole('article').filter({ hasText: title }).getByText('PUBLISHED', { exact: true })).toBeVisible()
  return title
}

async function registerForTicket(page: Page, title: string) {
  await page.getByRole('textbox', { name: 'Search activities' }).fill(title)
  await page.getByRole('article').filter({ hasText: title }).getByRole('button', { name: 'View details' }).click()
  await page.getByRole('button', { name: 'Register now', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(page.getByText('You’re registered', { exact: true })).toBeVisible()
}

test('mobile menu provides consistent navigation, dismissal and focus across all roles', async ({ browser }) => {
  for (const role of ['student', 'organizer', 'admin']) {
    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      await login(page, role)
      const header = page.getByRole('banner')
      const toggle = header.getByRole('button', { name: 'Toggle navigation', exact: true })
      const panel = page.locator('#mobile-navigation')
      for (const width of [320, 360, 768]) {
        await page.setViewportSize({ width, height: 800 })
        await toggle.click()
        await expect(toggle).toHaveAttribute('aria-expanded', 'true')
        await expect(panel.getByRole('button', { name: role === 'student' ? 'Discover' : role === 'organizer' ? 'My activities' : 'Overview', exact: true })).toBeFocused()
        const bounds = await panel.boundingBox()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(800)
        expect(await header.evaluate(element => Math.round(element.getBoundingClientRect().height))).toBe(65)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
        await page.keyboard.press('Escape')
        await expect(toggle).toBeFocused()
        await expect(panel).toHaveCount(0)
      }
      await page.setViewportSize({ width: 360, height: 800 })
      await header.screenshot({ path: `test-results/navigation-${role}-trigger.png`, animations: 'disabled' })
      await toggle.click()
      await page.screenshot({ path: `test-results/navigation-${role}-mobile.png`, animations: 'disabled' })
      await panel.getByRole('button', { name: 'My profile', exact: true }).hover()
      await page.screenshot({ path: `test-results/navigation-${role}-neon-hover.png` })
      if (role === 'organizer') {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.screenshot({ path: 'test-results/navigation-neon-reduced-motion.png' })
        await page.emulateMedia({ reducedMotion: 'no-preference' })
      }
      await panel.getByRole('button', { name: 'My profile', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'My profile', exact: true })).toBeVisible()
      await expect(panel).toHaveCount(0)
      await expect(toggle).toBeFocused()
      await toggle.click()
      await page.getByRole('main').click({ position: { x: 4, y: 4 } })
      await expect(panel).toHaveCount(0)
      await toggle.click()
      await panel.getByRole('button', { name: 'Sign out', exact: true }).focus()
      await page.keyboard.press('Tab')
      await expect(panel).toHaveCount(0)
      await toggle.click()
      await page.setViewportSize({ width: 1024, height: 800 })
      await expect(panel).toHaveCount(0)
      await expect(toggle).toBeHidden()
      await expect(header.locator('[aria-controls="mobile-navigation"]')).toHaveAttribute('aria-expanded', 'false')
      await expect(header.getByRole('navigation').getByRole('button', { name: 'My profile', exact: true })).toBeFocused()
      await page.setViewportSize({ width: 360, height: 360 })
      await toggle.click()
      const bounds = await panel.boundingBox()
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(360)
      await panel.getByRole('button', { name: 'Sign out', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Continue with Google', exact: true })).toBeVisible()
    } finally { await context.close() }
  }
})

test('compact header keeps workspace switching accessible on desktop and mobile', async ({ page }) => {
  await login(page, 'organizer')
  const header = page.getByRole('banner')
  const trigger = header.getByRole('button', { name: 'Switch workspace, current Organizer', exact: true })
  await expect(trigger).toBeVisible()
  await expect(header.getByRole('navigation')).toBeVisible()
  await expect(page.getByRole('main').getByRole('group', { name: 'Workspace selection' })).toHaveCount(0)
  for (const width of [320, 360, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await header.evaluate(element => Math.round(element.getBoundingClientRect().height))).toBe(65)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await trigger.click()
    await expect(page.getByRole('button', { name: 'Organizer workspace', exact: true })).toBeFocused()
    const bounds = await page.getByRole('group', { name: 'Workspace selection' }).boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  }
  await trigger.click()
  await page.keyboard.press('Home')
  await expect(page.getByRole('button', { name: 'Student workspace', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  const studentTrigger = header.getByRole('button', { name: 'Switch workspace, current Student', exact: true })
  await expect(studentTrigger).toBeFocused()
  await expect(page.getByRole('textbox', { name: 'Search activities' })).toBeVisible()
  await studentTrigger.click()
  await header.getByRole('button', { name: 'Discover', exact: true }).click()
  await expect(studentTrigger).toHaveAttribute('aria-expanded', 'false')
  await page.screenshot({ path: 'test-results/header-desktop.png', animations: 'disabled' })
  await page.setViewportSize({ width: 360, height: 800 })
  await studentTrigger.click()
  await page.screenshot({ path: 'test-results/header-mobile-workspaces.png', animations: 'disabled' })
  await page.getByRole('button', { name: 'Organizer workspace', exact: true }).click()
  await expect(header.getByRole('button', { name: 'Switch workspace, current Organizer', exact: true })).toBeVisible()
  await header.getByRole('button', { name: 'Toggle navigation', exact: true }).click()
  await header.getByRole('navigation').getByRole('button', { name: 'My profile', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'My profile', exact: true })).toBeVisible()
  await page.reload()
  await expect(header.getByRole('button', { name: 'Switch workspace, current Organizer', exact: true })).toBeVisible()
})

test('Organizer reviews and retries an idempotent facilities request, then receives signed completion updates', async ({ browser }) => {
  test.setTimeout(90000)
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    const title = await publishTicketEvent(page)
    const row = page.getByRole('article').filter({ hasText: title })
    await row.getByRole('button', { name: 'Edit', exact: true }).click()
    await page.getByLabel('Add facilities requirements', { exact: true }).check()
    const notes = 'Two microphones and projector setup before the campus workshop.'
    await page.getByLabel('Facilities notes', { exact: true }).fill(notes)
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await row.getByRole('button', { name: title, exact: true }).click()
    const activityId = page.url().split('/').at(-1)!
    const support = page.getByRole('region', { name: 'Facilities support', exact: true })
    await expect(support).toContainText('No maintenance request linked')
    let posts = 0
    page.on('request', request => { if (request.url().endsWith('/maintenance/requests') && request.method() === 'POST') posts++ })
    await support.getByRole('button', { name: 'Review facilities request', exact: true }).click()
    let dialog = page.getByRole('dialog', { name: 'Review facilities request', exact: true })
    await expect(dialog).toContainText(notes)
    await expect(dialog).toContainText('Team 10 Maintenance')
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    expect(posts).toBe(0)
    await support.getByRole('button', { name: 'Review facilities request', exact: true }).click()
    await dialog.getByLabel('Maintenance category', { exact: true }).selectOption('Electrical')
    const gate = await holdRequest(page, '**/api/activities/*/maintenance/requests', 'POST')
    await dialog.getByRole('button', { name: 'Send facilities request', exact: true }).click()
    await gate.wait()
    await expect(dialog).toContainText('Sending the facilities request')
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled()
    gate.release()
    await expect(dialog).toHaveCount(0)
    await expect(support).toContainText('The result could not be confirmed')
    await expect(support).not.toContainText('Request accepted by Team 10')
    await support.getByRole('button', { name: 'Review and retry request', exact: true }).click()
    dialog = page.getByRole('dialog', { name: 'Review facilities request', exact: true })
    await expect(dialog).toContainText('without creating a duplicate')
    await expect(dialog.getByLabel('Maintenance category', { exact: true })).toBeDisabled()
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    }
    await page.screenshot({ path: 'test-results/facilities-review-retry.png', animations: 'disabled' })
    await dialog.getByRole('button', { name: 'Retry original request', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(support).toContainText('Existing Team 10 work order linked to this activity.')
    await expect(support).toContainText('Maintenance status: OPEN')
    expect(posts).toBe(2)
    await page.clock.install()
    await page.reload()
    await expect(support).toContainText('Maintenance status: OPEN')
    execFileSync(process.execPath, ['tests/maintenance-fixture.mjs', activityId, 'resolve'], { env: testEnvironment(), stdio: 'pipe' })
    await page.clock.fastForward(15000)
    await expect(support).toContainText('Facilities support completed.')
    await expect(support).toContainText('Maintenance status: RESOLVED')
    execFileSync(process.execPath, ['tests/maintenance-fixture.mjs', activityId, 'stale'], { env: testEnvironment(), stdio: 'pipe' })
    await support.getByRole('button', { name: 'Refresh maintenance status', exact: true }).click()
    await expect(support).toContainText('Maintenance status: RESOLVED')
    await expect(support.getByRole('button', { name: 'Review facilities request', exact: true })).toHaveCount(0)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.screenshot({ path: 'test-results/facilities-resolved.png', fullPage: true, animations: 'disabled' })
    expect(errors).toEqual([])
  } finally { await context.close() }
})

test('capacity, deadlines, overnight schedules and private linked maintenance work across Student and Organizer screens', async ({ browser }) => {
  test.setTimeout(120000)
  const organizerContext = await browser.newContext({ timezoneId: 'America/New_York' })
  const studentContext = await browser.newContext({ timezoneId: 'UTC' })
  const organizer = await organizerContext.newPage(), student = await studentContext.newPage()
  const browserErrors: string[] = []
  for (const page of [organizer, student]) page.on('pageerror', error => browserErrors.push(error.message))
  try {
    await login(organizer, 'organizer')
    await organizer.getByRole('navigation').getByRole('button', { name: 'Create activity', exact: true }).click()
    const title = `Limited campus workshop ${Date.now()}`
    const notes = 'Projector, two microphones and room setup before the event.'
    await organizer.getByLabel('Activity title', { exact: true }).fill(title)
    await organizer.getByLabel('Description', { exact: true }).fill('A limited-seat event with a complete schedule and facilities requirements.')
    await organizer.getByLabel('Location', { exact: true }).fill('Campus Support Hall')
    await organizer.getByLabel('Date', { exact: true }).fill('2027-05-15')
    await organizer.getByLabel('Start time', { exact: true }).fill('18:30')
    await organizer.getByLabel('Add an end time', { exact: true }).check()
    await organizer.getByLabel('End time', { exact: true }).fill('18:00')
    await organizer.getByRole('button', { name: 'Save draft', exact: true }).click()
    await expect(organizer.getByRole('alert')).toContainText('end date and time must be after the start')
    await organizer.getByLabel('End date', { exact: true }).fill('2027-05-16')
    await organizer.getByLabel('End time', { exact: true }).fill('00:30')
    await organizer.getByLabel('Limit participant numbers', { exact: true }).check()
    await organizer.getByLabel('Maximum participants', { exact: true }).fill('1')
    await organizer.getByLabel('Set a registration deadline', { exact: true }).check()
    await organizer.getByLabel('Deadline date', { exact: true }).fill('2027-05-16')
    await organizer.getByLabel('Deadline time', { exact: true }).fill('18:30')
    await organizer.getByRole('button', { name: 'Save draft', exact: true }).click()
    await expect(organizer.getByRole('alert')).toContainText('deadline must be at or before the activity start')
    await organizer.getByLabel('Deadline date', { exact: true }).fill('2027-05-14')
    await organizer.getByLabel('Add facilities requirements', { exact: true }).check()
    await organizer.getByLabel('Facilities notes', { exact: true }).fill(notes)
    await expect(organizer.getByRole('region', { name: 'Activity review summary' })).toContainText('Notes saved only; no request sent')
    for (const width of [360, 768, 1024, 1440]) {
      await organizer.setViewportSize({ width, height: 900 })
      expect(await organizer.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    }
    await organizer.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await organizer.screenshot({ path: 'test-results/activity-policy-form.png', fullPage: true, animations: 'disabled' })
    const saving = organizer.waitForResponse(response => response.url().endsWith('/api/activities') && response.request().method() === 'POST')
    await organizer.getByRole('button', { name: 'Save draft', exact: true }).click()
    const stored = await (await saving).json()
    expect(stored.dateTime).toBe('2027-05-15T11:30:00.000Z')
    expect(stored.endDateTime).toBe('2027-05-15T17:30:00.000Z')
    expect(stored.registrationDeadline).toBe('2027-05-14T11:30:00.000Z')
    expect(stored.maxParticipants).toBe(1)
    const row = organizer.getByRole('article').filter({ hasText: title })
    await row.getByRole('button', { name: 'Edit', exact: true }).click()
    await expect(organizer.getByLabel('End date', { exact: true })).toHaveValue('2027-05-16')
    await expect(organizer.getByLabel('Maximum participants', { exact: true })).toHaveValue('1')
    await expect(organizer.getByLabel('Facilities notes', { exact: true })).toHaveValue(notes)
    await organizer.getByRole('button', { name: 'Back to my activities', exact: true }).click()
    await row.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(row.getByText('PUBLISHED', { exact: true })).toBeVisible()
    await login(student, 'student')
    await registerForTicket(student, title)
    await expect(student.getByText('1/1 registered · 0 seats left', { exact: true })).toBeVisible()
    await expect(student.getByText('Ends 16 May 2027, 00:30', { exact: true })).toBeVisible()
    await expect(student.getByText(notes, { exact: true })).toHaveCount(0)
    await switchWorkspace(organizer, 'Student')
    await organizer.getByRole('textbox', { name: 'Search activities' }).fill(title)
    await organizer.getByRole('article').filter({ hasText: title }).getByRole('button', { name: 'View details' }).click()
    await expect(organizer.getByRole('button', { name: 'Activity full', exact: true })).toBeDisabled()
    await student.getByRole('navigation').getByRole('button', { name: 'My registrations', exact: true }).click()
    await student.getByRole('article').filter({ hasText: title }).getByRole('button', { name: 'Cancel', exact: true }).click()
    await student.getByRole('dialog').getByRole('button', { name: 'Cancel registration', exact: true }).click()
    await expect(student.getByRole('dialog')).toHaveCount(0)
    await organizer.reload()
    await expect(organizer.getByRole('button', { name: 'Register now', exact: true })).toBeEnabled()
    await switchWorkspace(organizer, 'Organizer')
    await row.getByRole('button', { name: title, exact: true }).click()
    const support = organizer.getByRole('region', { name: 'Facilities support', exact: true })
    await expect(support).toContainText(notes)
    await expect(support).toContainText('No maintenance request linked')
    const refresh = await holdRequest(organizer, '**/api/activities/*/maintenance')
    await support.getByRole('button', { name: 'Refresh maintenance status', exact: true }).click()
    await refresh.wait()
    await expect(support).toContainText('Checking the latest maintenance update')
    refresh.release()
    await expect(support.getByText('Checking the latest maintenance update', { exact: true })).toHaveCount(0)
    execFileSync(process.execPath, ['tests/maintenance-fixture.mjs', stored.id, 'link'], { env: testEnvironment(), stdio: 'pipe' })
    await support.getByRole('button', { name: 'Refresh maintenance status', exact: true }).click()
    await expect(support).toContainText('Waiting for a maintenance update')
    execFileSync(process.execPath, ['tests/maintenance-fixture.mjs', stored.id, 'update'], { env: testEnvironment(), stdio: 'pipe' })
    await support.getByRole('button', { name: 'Refresh maintenance status', exact: true }).click()
    await expect(support).toContainText('Maintenance status: ASSIGNED')
    await organizer.reload()
    await expect(support).toContainText('Maintenance status: ASSIGNED')
    await organizer.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await organizer.screenshot({ path: 'test-results/activity-linked-maintenance.png', fullPage: true, animations: 'disabled' })
    await organizer.route('**/api/activities/*/maintenance', route => route.abort())
    await support.getByRole('button', { name: 'Refresh maintenance status', exact: true }).click()
    await expect(support.getByRole('alert')).toContainText('Cannot reach the campus API')
    await organizer.unroute('**/api/activities/*/maintenance')
    await support.getByRole('button', { name: 'Try again', exact: true }).click()
    await expect(support).toContainText('Maintenance status: ASSIGNED')
    await organizer.getByRole('button', { name: 'Back to activities', exact: true }).click()
    await row.getByRole('button', { name: 'Edit', exact: true }).click()
    await organizer.getByLabel('Deadline date', { exact: true }).fill('2020-01-01')
    await organizer.getByRole('button', { name: 'Save changes', exact: true }).click()
    await student.goto(`/#activity/${stored.id}`)
    await expect(student.getByRole('button', { name: 'Registration deadline passed', exact: true })).toBeDisabled()
    await expect(student.getByText(notes, { exact: true })).toHaveCount(0)
    await student.setViewportSize({ width: 360, height: 900 })
    const notice = student.getByRole('button', { name: 'Dismiss message', exact: true })
    if (await notice.isVisible()) await notice.click()
    expect(await student.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await student.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await student.screenshot({ path: 'test-results/activity-deadline-mobile.png', fullPage: true, animations: 'disabled' })
    expect(browserErrors).toEqual([])
  } finally { await Promise.all([organizerContext.close(), studentContext.close()]) }
})

test('ticket upload accepts real PNG bytes without file metadata and separates recovery errors', async ({ browser }) => {
  test.setTimeout(120000)
  const organizerContext = await browser.newContext()
  const studentContext = await browser.newContext()
  const organizer = await organizerContext.newPage()
  const student = await studentContext.newPage()
  try {
    const title = await publishTicketEvent(organizer)
    await login(student, 'student')
    await registerForTicket(student, title)
    await student.getByRole('button', { name: 'View ticket', exact: true }).click()
    const qr = student.getByRole('img', { name: 'Your registration QR ticket', exact: true })
    await expect(qr).toBeVisible()
    const source = (await qr.getAttribute('src'))!
    const png = Buffer.from(source.split(',')[1], 'base64')
    const fixtures = await student.evaluate(async source => {
      const image = new Image(); image.src = source; await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = 280; canvas.height = 280
      const context = canvas.getContext('2d')!
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, 280, 280)
      for (let i = 0; i < pixels.data.length; i += 4) if (pixels.data[i] > 220) pixels.data[i + 3] = 0
      context.putImageData(pixels, 0, 0)
      const transparent = canvas.toDataURL('image/png')
      canvas.width = 1200; canvas.height = 2400
      context.fillStyle = '#f8fafc'; context.fillRect(0, 0, 1200, 2400)
      context.fillStyle = '#0f172a'; context.font = '32px sans-serif'; context.fillText('Campus Events & Clubs registration ticket', 80, 100)
      context.save(); context.translate(800, 1800); context.rotate(Math.PI / 2); context.drawImage(image, -140, -140); context.restore()
      const screenshot = canvas.toDataURL('image/png')
      canvas.width = 500; canvas.height = 500
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, 500, 500)
      const blank = canvas.toDataURL('image/png')
      context.drawImage(image, 110, 110)
      const jpeg = canvas.toDataURL('image/jpeg', 0.9)
      const webp = canvas.toDataURL('image/webp', 0.9)
      canvas.width = 17000; canvas.height = 2
      const oversizedDimensions = canvas.toDataURL('image/png')
      return { transparent, screenshot, blank, jpeg, webp, oversizedDimensions }
    }, source)
    const bytes = (url: string) => Buffer.from(url.split(',')[1], 'base64')
    await organizer.getByRole('article').filter({ hasText: title }).getByRole('button', { name: 'Roster', exact: true }).click()
    await organizer.getByRole('button', { name: 'Scan tickets', exact: true }).click()
    const toast = organizer.getByRole('button', { name: 'Dismiss message', exact: true })
    if (await toast.isVisible()) await toast.click()
    let verifyRequests = 0
    organizer.on('request', request => { if (request.url().includes('/tickets/verify')) verifyRequests++ })
    const input = organizer.getByLabel('Upload ticket image', { exact: true })
    const invalidImages = [
      { file: { name: 'notes.png', mimeType: 'image/png', buffer: Buffer.from('not an image') }, title: 'Choose a supported image' },
      { file: { name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) }, title: 'This image is too large' },
      { file: { name: 'broken.png', mimeType: 'image/png', buffer: png.subarray(0, 12) }, title: 'This image could not be opened' },
      { file: { name: 'blank.png', mimeType: 'image/png', buffer: bytes(fixtures.blank) }, title: 'The QR could not be read' },
      { file: { name: 'wide.png', mimeType: 'image/png', buffer: bytes(fixtures.oversizedDimensions) }, title: 'This image is too large to read' },
    ]
    for (const { file, title: expectedTitle } of invalidImages) {
      await input.setInputFiles(file)
      await expect(organizer.getByRole('alert')).toContainText(expectedTitle)
      await expect(organizer.getByRole('button', { name: 'Upload ticket image', exact: true })).toBeEnabled()
    }
    const { default: QRCode } = await import('qrcode')
    await input.setInputFiles({ name: 'other.png', mimeType: 'image/png', buffer: await QRCode.toBuffer('https://example.com/other-qr') })
    await expect(organizer.getByRole('alert')).toContainText('This is not a Campus Events & Clubs ticket')
    expect(verifyRequests).toBe(0)
    await organizer.setViewportSize({ width: 360, height: 900 })
    expect(await organizer.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await organizer.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await organizer.screenshot({ path: 'test-results/qr-upload-recovery-mobile.png', fullPage: true, animations: 'disabled', mask: [organizer.locator('[data-ticket-secret]')], maskColor: '#e2e8f0' })
    await organizer.getByRole('button', { name: 'Enter ticket code', exact: true }).click()
    await expect(organizer.getByLabel('Ticket code', { exact: true })).toBeFocused()
    await expect(organizer.getByRole('alert')).toHaveCount(0)
    for (const width of [360, 768, 1024, 1440]) {
      await organizer.setViewportSize({ width, height: 900 })
      expect(await organizer.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    }
    await organizer.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await organizer.screenshot({ path: 'test-results/qr-upload-refined-desktop.png', fullPage: true, animations: 'disabled', mask: [organizer.locator('[data-ticket-secret]')], maskColor: '#e2e8f0' })
    // Empty/incorrect metadata, transparent exports, rotated screenshot, JPEG/WebP.
    for (const file of [
      { name: 'ticket', mimeType: '', buffer: png },
      { name: 'ticket.bin', mimeType: 'application/octet-stream', buffer: png },
      { name: 'transparent.png', mimeType: 'image/png', buffer: bytes(fixtures.transparent) },
      { name: 'screenshot.png', mimeType: 'image/png', buffer: bytes(fixtures.screenshot) },
      { name: 'ticket.jpg', mimeType: 'image/jpeg', buffer: bytes(fixtures.jpeg) },
      { name: 'ticket.webp', mimeType: 'image/webp', buffer: bytes(fixtures.webp) },
    ]) {
      await input.setInputFiles(file)
      await expect(organizer.getByText('Valid registration', { exact: true })).toBeVisible()
      await organizer.getByRole('button', { name: 'Use another ticket', exact: true }).click()
    }
    expect(verifyRequests).toBe(6)
    await organizer.getByRole('button', { name: 'Back to roster', exact: true }).click()
    await expect(organizer.getByText('1 active registrations · 0 checked in', { exact: true })).toBeVisible()
  } finally { await Promise.all([studentContext.close(), organizerContext.close()]) }
})

test('QR ticket image, permission fallback, explicit attendance confirmation and manual roster check-in', async ({ browser }) => {
  test.setTimeout(120000)
  const studentContext = await browser.newContext()
  const organizerContext = await browser.newContext()
  const student = await studentContext.newPage()
  const organizer = await organizerContext.newPage()
  const errors: string[] = []
  for (const page of [student, organizer]) page.on('pageerror', error => errors.push(error.message))
  await organizerContext.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => { throw new DOMException('Test permission denial', 'NotAllowedError') } })
  })
  try {
    const title = await publishTicketEvent(organizer)
    await login(student, 'student')
    await registerForTicket(student, title)
    const pendingTicket = await holdRequest(student, '**/api/registrations/*/ticket', 'POST')
    await student.getByRole('button', { name: 'View ticket', exact: true }).click()
    await pendingTicket.wait()
    await expect(student.getByText('Preparing your registration ticket', { exact: true })).toBeVisible()
    pendingTicket.release()
    const qr = student.getByRole('img', { name: 'Your registration QR ticket', exact: true })
    await expect(qr).toBeVisible()
    const code = await student.locator('code[data-ticket-secret]').innerText()
    const downloadEvent = student.waitForEvent('download')
    await student.getByRole('link', { name: 'Download QR', exact: true }).click()
    const download = await downloadEvent
    expect(download.suggestedFilename()).toBe('campus-events-clubs-ticket.png')
    const imagePath = await download.path()
    expect(imagePath).toBeTruthy()
    await student.reload()
    await expect(qr).toBeVisible()
    expect(await student.locator('code[data-ticket-secret]').innerText() === code).toBeTruthy()
    for (const width of [360, 768, 1024, 1440]) {
      await student.setViewportSize({ width, height: 900 })
      expect(await student.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
      if (width === 360 || width === 1440) await student.screenshot({ path: `test-results/ticket-${width}-masked.png`, fullPage: true, mask: [student.locator('[data-ticket-secret]')], maskColor: '#e2e8f0' })
    }
    await organizer.getByRole('article').filter({ hasText: title }).getByRole('button', { name: 'Roster', exact: true }).click()
    await organizer.getByRole('button', { name: 'Scan tickets', exact: true }).click()
    await organizer.getByRole('button', { name: 'Start camera', exact: true }).click()
    await expect(organizer.getByRole('alert')).toContainText('Camera access was denied')
    await organizer.getByRole('button', { name: 'Upload ticket image', exact: true }).focus()
    await expect(organizer.getByRole('button', { name: 'Upload ticket image', exact: true })).toBeFocused()
    const preview = await holdRequest(organizer, '**/api/activities/*/tickets/verify', 'POST')
    await organizer.getByLabel('Upload ticket image', { exact: true }).setInputFiles({ name: 'campus-pulse-ticket.png', mimeType: 'image/png', buffer: await readFile(imagePath!) })
    await preview.wait()
    await expect(organizer.getByText('Verifying the ticket', { exact: true })).toBeVisible()
    preview.release()
    await expect(organizer.getByRole('region', { name: 'Verified attendee' })).toContainText('e2e.student@lamduan.mfu.ac.th')
    await expect(organizer.getByText('Valid registration', { exact: true })).toBeVisible()
    await expect(organizer.getByText('Attendance recorded', { exact: true })).toHaveCount(0)
    for (const width of [360, 768, 1024, 1440]) {
      await organizer.setViewportSize({ width, height: 900 })
      expect(await organizer.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    }
    const checkingIn = await holdRequest(organizer, '**/api/activities/*/check-ins', 'POST')
    await organizer.getByRole('button', { name: 'Confirm check-in', exact: true }).click()
    await checkingIn.wait()
    await expect(organizer.getByText('Recording attendance', { exact: true })).toBeVisible()
    checkingIn.release()
    await expect(organizer.getByText('Attendance recorded', { exact: true })).toBeVisible()
    await organizer.screenshot({ path: 'test-results/check-in-confirmed.png', fullPage: true })
    await organizer.getByRole('button', { name: 'Scan next ticket', exact: true }).click()
    await organizer.getByLabel('Ticket code', { exact: true }).fill(code)
    await organizer.getByRole('button', { name: 'Verify ticket', exact: true }).click()
    await expect(organizer.getByText('Already checked in', { exact: true })).toBeVisible()
    await expect(organizer.getByRole('button', { name: 'Confirm check-in', exact: true })).toHaveCount(0)
    await student.getByRole('button', { name: 'Refresh ticket', exact: true }).click()
    await expect(student.getByRole('heading', { name: 'You’re checked in', exact: true })).toBeVisible()
    await expect(qr).toHaveCount(0)
    await student.getByRole('button', { name: 'Back to my registrations', exact: true }).click()
    const registration = student.getByRole('article').filter({ hasText: title })
    await expect(registration.getByText('Checked in', { exact: true })).toBeVisible()
    await expect(registration.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0)

    // The enrolled Organizer also retains Student access and can attend.
    await switchWorkspace(organizer, 'Student')
    await registerForTicket(organizer, title)
    await switchWorkspace(organizer, 'Organizer')
    await organizer.getByRole('article').filter({ hasText: title }).getByRole('button', { name: 'Roster', exact: true }).click()
    await expect(organizer.getByText('2 active registrations · 1 checked in', { exact: true })).toBeVisible()
    await organizer.getByRole('article').filter({ hasText: 'e2e.organizer@lamduan.mfu.ac.th' }).getByRole('button', { name: 'Check in', exact: true }).click()
    await organizer.getByRole('dialog').getByRole('button', { name: 'Confirm check-in', exact: true }).click()
    await expect(organizer.getByText('2 active registrations · 2 checked in', { exact: true })).toBeVisible()
    await expect(organizer.getByRole('article').getByText('Checked in', { exact: true })).toHaveCount(2)
    await organizer.reload()
    await expect(organizer.getByText('2 active registrations · 2 checked in', { exact: true })).toBeVisible()
    await organizer.screenshot({ path: 'test-results/attendance-roster.png', fullPage: true })
    expect(errors).toEqual([])
  } finally { await Promise.all([studentContext.close(), organizerContext.close()]) }
})

test('QR camera decoding uses video frames and stops its stream after detection and navigation', async ({ browser }) => {
  test.setTimeout(90000)
  const organizerContext = await browser.newContext()
  const studentContext = await browser.newContext()
  const organizer = await organizerContext.newPage()
  const student = await studentContext.newPage()
  try {
    const title = await publishTicketEvent(organizer)
    await login(student, 'student')
    await registerForTicket(student, title)
    await student.getByRole('button', { name: 'View ticket', exact: true }).click()
    const qr = student.getByRole('img', { name: 'Your registration QR ticket', exact: true })
    await expect(qr).toBeVisible()
    const image = await qr.getAttribute('src')
    // Exercise the real QR video decoder with a synthetic local media stream.
    // No physical camera or browser permission is claimed by this check.
    await organizer.evaluate(image => {
      const state = window as unknown as { ticketTestTracks: MediaStreamTrack[]; ticketTestBlank: boolean }
      state.ticketTestTracks = []; state.ticketTestBlank = false
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
        const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480
        const drawing = canvas.getContext('2d')!
        drawing.fillStyle = '#ffffff'; drawing.fillRect(0, 0, 640, 480)
        if (!state.ticketTestBlank) {
          const img = new Image(); img.src = image!; await img.decode(); drawing.drawImage(img, 140, 60, 360, 360)
        }
        const stream = canvas.captureStream(5)
        state.ticketTestTracks.push(...stream.getTracks())
        return stream
      } })
    }, image)
    await organizer.getByRole('article').filter({ hasText: title }).getByRole('button', { name: 'Roster', exact: true }).click()
    await organizer.getByRole('button', { name: 'Scan tickets', exact: true }).click()
    expect(await organizer.evaluate(() => (window as unknown as { ticketTestTracks: unknown[] }).ticketTestTracks.length)).toBe(0)
    await organizer.getByRole('button', { name: 'Start camera', exact: true }).click()
    await expect(organizer.getByText('Valid registration', { exact: true })).toBeVisible()
    await expect.poll(() => organizer.evaluate(() => (window as unknown as { ticketTestTracks: MediaStreamTrack[] }).ticketTestTracks.every(track => track.readyState === 'ended'))).toBeTruthy()
    await organizer.getByRole('button', { name: 'Use another ticket', exact: true }).click()
    await organizer.evaluate(() => { (window as unknown as { ticketTestBlank: boolean }).ticketTestBlank = true })
    await organizer.getByRole('button', { name: 'Start camera', exact: true }).click()
    await expect(organizer.getByText('Point the camera at one registration QR.', { exact: false })).toBeVisible()
    await organizer.getByRole('button', { name: 'Back to roster', exact: true }).click()
    await expect.poll(() => organizer.evaluate(() => (window as unknown as { ticketTestTracks: MediaStreamTrack[] }).ticketTestTracks.every(track => track.readyState === 'ended'))).toBeTruthy()
    await expect(organizer.getByText('1 active registrations · 0 checked in', { exact: true })).toBeVisible()
  } finally { await Promise.all([organizerContext.close(), studentContext.close()]) }
})

async function googleLogin(page: Page, email: string) {
  // The emulator widget loads optional styling from public CDNs. Keep automated
  // checks independent of those assets; Auth/API/Firestore requests remain real.
  await page.context().route("https://unpkg.com/**", route => route.abort())
  await page.context().route("https://fonts.googleapis.com/**", route => route.abort())
  await page.goto("/")
  const popupPromise = page.waitForEvent("popup")
  await page.getByRole("button", { name: "Continue with Google", exact: true }).click()
  const popup = await popupPromise
  await popup.waitForLoadState("domcontentloaded")
  await popup.getByRole("button", { name: "Add new account", exact: true }).click()
  await popup.locator("#email-input").fill(email)
  await popup.locator("#sign-in").click()
}
async function switchWorkspace(page: Page, workspace: 'Student' | 'Organizer') {
  await page.getByRole('button', { name: /^Switch workspace, current / }).click()
  await page.getByRole('button', { name: `${workspace} workspace`, exact: true }).click()
}
async function login(page: Page, role: string) {
  await googleLogin(page, `e2e.${role}@lamduan.mfu.ac.th`)
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible()
  if (role === "organizer") await switchWorkspace(page, 'Organizer')
}

async function holdRequest(page: Page, pattern: string, method = 'GET') {
  let unblock!: () => void
  let entered = false
  let released = false
  const gate = new Promise<void>(resolve => { unblock = resolve })
  await page.route(pattern, async route => {
    if (released || route.request().method() !== method) { await route.continue(); return }
    entered = true
    await gate
    await route.continue().catch(() => {})
  })
  return { release: () => { released = true; unblock() }, wait: () => expect.poll(() => entered).toBeTruthy() }
}

async function expectSingleProgress(scope: Page | Locator, action: string) {
  const button = scope.getByRole('button', { name: action, exact: true })
  await expect(button).toBeDisabled()
  await expect(button).toHaveAttribute('aria-busy', 'true')
  await expect(button.locator('.animate-spin')).toHaveCount(0)
  await expect(scope.locator('[role="status"]')).toHaveCount(1)
  await expect(scope.locator('.animate-spin')).toHaveCount(1)
}

test("real cross-role publish, register, refresh, cancel, roster and read-only Admin flow", async ({ browser }) => {
  const organizer = await browser.newContext({ timezoneId: "America/New_York" })
  const student = await browser.newContext({ timezoneId: "UTC" })
  const admin = await browser.newContext()
  const organizerPage = await organizer.newPage()
  const studentPage = await student.newPage()
  const adminPage = await admin.newPage()
  const browserErrors: string[] = []
  for (const page of [organizerPage, studentPage, adminPage]) page.on("pageerror", error => browserErrors.push(error.message))
  try {
    await login(organizerPage, "organizer")
    await organizerPage.getByRole("navigation").getByRole("button", { name: "Create activity", exact: true }).click()
    const title = `Browser campus event ${Date.now()}`
    await organizerPage.getByLabel("Activity title", { exact: true }).fill(title)
    await organizerPage.getByLabel("Description", { exact: true }).fill("An activity saved through the real browser, API, and Firestore emulator.")
    await organizerPage.getByLabel("Activity type", { exact: true }).selectOption("CLUB_ACTIVITY")
    await organizerPage.getByLabel("Location", { exact: true }).fill("Browser Test Hall")
    await organizerPage.getByLabel("Date", { exact: true }).fill("2027-01-15")
    await organizerPage.getByLabel("Start time", { exact: true }).fill("18:30")
    await expect(organizerPage.locator('p').filter({ hasText: 'Selected schedule:' })).toContainText('15 Jan 2027 · 18:30')
    const savedDraft = organizerPage.waitForResponse(response => response.url().endsWith("/api/activities") && response.request().method() === "POST")
    await organizerPage.getByRole("button", { name: "Save draft", exact: true }).click()
    const stored = await (await savedDraft).json()
    expect(stored.dateTime).toBe("2027-01-15T11:30:00.000Z")
    expect(stored.location).toBe("Browser Test Hall")
    expect(stored.activityType).toBe("CLUB_ACTIVITY")
    let row = organizerPage.getByRole("article").filter({ hasText: title })
    await expect(row.getByText("DRAFT", { exact: true })).toBeVisible()
    await row.getByRole("button", { name: "Edit", exact: true }).click()
    await expect(organizerPage.getByLabel("Location", { exact: true })).toHaveValue("Browser Test Hall")
    await expect(organizerPage.getByLabel("Date", { exact: true })).toHaveValue("2027-01-15")
    await expect(organizerPage.getByLabel("Start time", { exact: true })).toHaveValue("18:30")
    await expect(organizerPage.getByLabel("Activity type", { exact: true })).toHaveValue("CLUB_ACTIVITY")
    await organizerPage.getByRole("button", { name: "Back to my activities", exact: true }).click()

    await login(studentPage, "student")
    await studentPage.getByRole("textbox", { name: "Search activities" }).fill(title)
    await expect(studentPage.getByRole("heading", { name: title, exact: true })).toHaveCount(0)

    row = organizerPage.getByRole("article").filter({ hasText: title })
    await row.getByRole("button", { name: "Publish", exact: true }).click()
    await expect(row.getByText("PUBLISHED", { exact: true })).toBeVisible()
    await studentPage.getByRole("button", { name: "Refresh activities", exact: true }).click()
    const card = studentPage.getByRole("article").filter({ hasText: title })
    await card.getByRole("button", { name: "View details" }).click()
    await expect(studentPage.getByText("Browser Test Hall", { exact: true })).toBeVisible()
    await expect(studentPage.getByText("18:30", { exact: false })).toBeVisible()
    await studentPage.getByRole("button", { name: "Register now", exact: true }).click()
    await expect(studentPage.getByRole("dialog")).toBeVisible()
    await studentPage.keyboard.press("Escape")
    await expect(studentPage.getByRole("dialog")).toHaveCount(0)
    await expect(studentPage.getByRole("button", { name: "Register now", exact: true })).toBeFocused()
    await studentPage.getByRole("button", { name: "Register now", exact: true }).click()
    await studentPage.getByRole("button", { name: "Confirm", exact: true }).click()
    await expect(studentPage.getByText("You’re registered", { exact: true })).toBeVisible()
    await studentPage.reload()
    await expect(studentPage.getByText("You’re registered", { exact: true })).toBeVisible()
    await studentPage.getByRole("button", { name: "My registrations", exact: true }).click()
    const registration = studentPage.getByRole("article").filter({ hasText: title })
    await expect(registration).toBeVisible()
    await registration.getByRole("button", { name: "Cancel", exact: true }).click()
    await studentPage.getByRole("dialog").getByRole("button", { name: "Cancel registration", exact: true }).click()
    await studentPage.getByRole("button", { name: "Cancelled", exact: true }).click()
    await expect(registration).toBeVisible()
    await studentPage.reload()
    await studentPage.getByRole("button", { name: "Cancelled", exact: true }).click()
    await expect(registration.getByText("CANCELLED", { exact: true })).toBeVisible()
    await registration.getByRole("button", { name: "Details", exact: true }).click()
    await studentPage.getByRole("button", { name: "Register now", exact: true }).click()
    await studentPage.getByRole("button", { name: "Confirm", exact: true }).click()
    await expect(studentPage.getByText("You’re registered", { exact: true })).toBeVisible()

    await organizerPage.getByRole("button", { name: "Refresh activities", exact: true }).click()
    await organizerPage.getByRole("article").filter({ hasText: title }).getByRole("button", { name: "Roster", exact: true }).click()
    await expect(organizerPage.getByText("1 active registrations · 0 checked in", { exact: true })).toBeVisible()
    await expect(organizerPage.getByText("e2e.student@lamduan.mfu.ac.th", { exact: true }).first()).toBeVisible()

    await login(adminPage, "admin")
    await expect(adminPage.getByRole("heading", { name: "Campus activity overview", exact: true })).toBeVisible()
    await expect(adminPage.getByText("Sample: International Film Night", { exact: true })).toBeVisible()
    await adminPage.getByRole("article").filter({ hasText: title }).getByRole("button", { name: "View details", exact: true }).click()
    await expect(adminPage.getByRole("heading", { name: title, exact: true })).toBeVisible()
    await expect(adminPage.getByText("1 active registrations", { exact: true })).toBeVisible()
    await expect(adminPage.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0)
    await expect(adminPage.getByRole("button", { name: "Register now", exact: true })).toHaveCount(0)
    await expect(adminPage.getByText("e2e.student@lamduan.mfu.ac.th", { exact: true })).toHaveCount(0)
    await adminPage.goto("/#organizer-activities")
    await expect(adminPage.getByRole("heading", { name: "Campus activity overview", exact: true })).toBeVisible()
    await adminPage.screenshot({ path: "test-results/admin-overview.png", fullPage: true })
    expect(browserErrors).toEqual([])
  } finally {
    await Promise.all([organizer.close(), student.close(), admin.close()])
  }
})

test("mobile navigation, closed activities, and actionable network errors", async ({ page }) => {
  await login(page, "student")
  await page.setViewportSize({ width: 360, height: 800 })
  await expect(page.getByRole("button", { name: "Toggle navigation", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Toggle navigation", exact: true }).click()
  await page.getByRole("button", { name: "My registrations", exact: true }).click()
  await expect(page.getByRole("heading", { name: "My registrations", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Toggle navigation", exact: true }).click()
  await page.getByRole("button", { name: "Discover", exact: true }).click()
  await page.getByRole("textbox", { name: "Search activities" }).fill("Sample: Previous")
  await page.getByRole("article").filter({ hasText: "Sample: Previous Campus Workshop" }).getByRole("button", { name: "View details" }).click()
  await expect(page.getByRole("button", { name: "Registration closed", exact: true })).toBeDisabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }))
  await page.screenshot({ path: "test-results/student-mobile.png", fullPage: true })
  await page.getByRole("button", { name: "Back to activities", exact: true }).click()
  await expect(page.getByRole("textbox", { name: "Search activities" })).toBeVisible()
  await page.route("**/api/activities?**", route => route.abort())
  await page.getByRole("button", { name: "Refresh activities", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("Cannot reach the campus API")
  await page.unroute("**/api/activities?**")
  await page.getByRole("button", { name: "Try again", exact: true }).click()
  await expect(page.getByRole("textbox", { name: "Search activities" })).toBeVisible()
  await expect(page.getByRole("alert")).toHaveCount(0)
})

test("Organizer form publishing, published edits, closing, draft deletion and responsive layouts", async ({ page }) => {
  await login(page, "organizer")
  await page.getByRole("navigation").getByRole("button", { name: "Create activity", exact: true }).click()
  const title = `Form publish ${Date.now()}`
  await page.getByLabel("Activity title", { exact: true }).fill(title)
  await page.getByLabel("Description", { exact: true }).fill("A publish action from the form with real persisted fields.")
  await page.getByLabel("Location", { exact: true }).fill("Form Test Room")
  await page.getByRole('button', { name: 'Open calendar', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.getByLabel("Date", { exact: true }).fill("2027-02-10")
  await page.getByLabel("Start time", { exact: true }).fill("09:15")
  await expect(page.locator('p').filter({ hasText: 'Selected schedule:' })).toContainText('10 Feb 2027 · 09:15')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.mouse.move(0, 0)
  await page.screenshot({ path: "test-results/organizer-form-refined.png", fullPage: true, animations: "disabled" })
  await page.getByRole("button", { name: "Publish activity", exact: true }).click()
  const row = page.getByRole("article").filter({ hasText: title })
  await expect(row.getByText("PUBLISHED", { exact: true })).toBeVisible()
  await row.getByRole("button", { name: "Edit", exact: true }).click()
  await page.getByLabel("Location", { exact: true }).fill("Updated Form Room")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(row).toContainText("Updated Form Room")
  await row.getByRole("button", { name: "Close", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("button", { name: "Close dialog", exact: true })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(dialog.getByRole("button", { name: "Close activity", exact: true })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(dialog.getByRole("button", { name: "Close dialog", exact: true })).toBeFocused()
  await dialog.getByRole("button", { name: "Close activity", exact: true }).click()
  await expect(row.getByText("CLOSED", { exact: true })).toBeVisible()
  await expect(row.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0)
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
  }
  const draft = page.getByRole("article").filter({ hasText: "Sample: International Film Night" })
  await draft.getByRole("button", { name: "Delete", exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Delete draft", exact: true }).click()
  await expect(draft).toHaveCount(0)
})

test("Google-only login enrolls MFU Students and directs personal accounts to Organizer requests", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeVisible()
  const email = `e2e.new.${Date.now()}@lamduan.mfu.ac.th`
  await googleLogin(page, email)
  await expect(page.getByRole("heading", { name: "Complete your campus profile", exact: true })).toBeVisible()
  await page.getByLabel("University ID", { exact: true }).fill("INVALID/ID")
  expect(await page.getByLabel("University ID", { exact: true }).evaluate((input: HTMLInputElement) => input.validity.patternMismatch)).toBe(true)
  await page.getByLabel("University ID", { exact: true }).fill(`E2E-${Date.now()}`)
  await page.getByRole("button", { name: "Continue to campus", exact: true }).click()
  await expect(page.getByRole("button", { name: "My registrations", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Create activity", exact: true })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole("button", { name: "My registrations", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Sign out", exact: true }).click()
  await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeVisible()
  await googleLogin(page, `e2e.outsider.${Date.now()}@gmail.com`)
  await expect(page.getByRole("heading", { name: "Request Organizer access", exact: true })).toBeVisible()
  await expect(page.getByText("Student access is limited to @lamduan.mfu.ac.th accounts.", { exact: false })).toBeVisible()
  await expect(page.getByRole("button", { name: "My registrations", exact: true })).toHaveCount(0)
})

test("personal Google applicant is rejected, resubmits, receives Admin approval and can publish", async ({ browser }) => {
  const applicantContext = await browser.newContext()
  const adminContext = await browser.newContext()
  const applicant = await applicantContext.newPage()
  const admin = await adminContext.newPage()
  try {
    const email = `e2e.organizer.${Date.now()}@gmail.com`
    const organization = `School partner ${Date.now()}`
    await googleLogin(applicant, email)
    await expect(applicant.getByRole("heading", { name: "Request Organizer access", exact: true })).toBeVisible()
    await applicant.getByLabel("Club or organization", { exact: true }).fill(organization)
    await applicant.getByLabel("Why do you need Organizer access?", { exact: true }).fill("I would like to hold a workshop with the school student office.")
    await applicant.getByRole("button", { name: "Submit Organizer request", exact: true }).click()
    await expect(applicant.getByRole("heading", { name: "Pending Admin approval", exact: true })).toBeVisible()
    await applicant.reload()
    await expect(applicant.getByRole("heading", { name: "Pending Admin approval", exact: true })).toBeVisible()
    await expect(applicant.getByRole("button", { name: "Create activity", exact: true })).toHaveCount(0)

    await login(admin, "admin")
    await admin.getByRole("navigation").getByRole("button", { name: "Organizer requests", exact: true }).click()
    let card = admin.getByRole("article").filter({ hasText: organization })
    await expect(card.getByText(email, { exact: true })).toBeVisible()
    await card.getByRole("button", { name: "Reject", exact: true }).click()
    await admin.getByRole("dialog").getByLabel("Reason for rejection", { exact: true }).fill("Please explain which school office is partnering with you.")
    await admin.getByRole("dialog").getByRole("button", { name: "Confirm rejection", exact: true }).click()
    await applicant.getByRole("button", { name: "Refresh request status", exact: true }).click()
    await expect(applicant.getByRole("heading", { name: "Request not approved", exact: true })).toBeVisible()
    await expect(applicant.getByText("Please explain which school office is partnering with you.", { exact: true })).toBeVisible()
    await applicant.getByLabel("Why do you need Organizer access?", { exact: true }).fill("The student affairs office is partnering with our organization for the workshop.")
    await applicant.getByRole("button", { name: "Submit Organizer request", exact: true }).click()
    await expect(applicant.getByRole("heading", { name: "Pending Admin approval", exact: true })).toBeVisible()
    await admin.getByRole("button", { name: "Refresh requests", exact: true }).click()
    card = admin.getByRole("article").filter({ hasText: organization })
    await card.getByRole("button", { name: "Approve", exact: true }).click()
    await expect(admin.getByRole("dialog")).toContainText(email)
    await admin.getByRole("dialog").getByRole("button", { name: "Confirm approval", exact: true }).click()
    await admin.getByRole("button", { name: "Approved", exact: true }).click()
    await expect(admin.getByRole("article").filter({ hasText: organization }).getByText("APPROVED", { exact: true })).toBeVisible()
    await applicant.getByRole("button", { name: "Refresh request status", exact: true }).click()
    await expect(applicant.getByRole("heading", { name: "Organizer access approved", exact: true })).toBeVisible()
    await applicant.getByRole("button", { name: "Continue to Organizer workspace", exact: true }).click()
    await expect(applicant.getByRole("heading", { name: "My activities", exact: true })).toBeVisible()
    await applicant.reload()
    await expect(applicant.getByRole("heading", { name: "My activities", exact: true })).toBeVisible()
    await applicant.getByRole("navigation").getByRole("button", { name: "Create activity", exact: true }).click()
    await applicant.getByLabel("Activity title", { exact: true }).fill(`Approved partner event ${Date.now()}`)
    await applicant.getByLabel("Description", { exact: true }).fill("A real activity created through the approved Organizer workflow in isolated tests.")
    await applicant.getByLabel("Location", { exact: true }).fill("Partner workshop room")
    await applicant.getByLabel("Date", { exact: true }).fill("2027-03-15")
    await applicant.getByLabel("Start time", { exact: true }).fill("14:00")
    await applicant.getByRole("button", { name: "Publish activity", exact: true }).click()
    await expect(applicant.getByRole("article").filter({ hasText: "Approved partner event" }).getByText("PUBLISHED", { exact: true })).toBeVisible()
    await admin.screenshot({ path: "test-results/organizer-approval-admin.png", fullPage: true })
  } finally { await Promise.all([applicantContext.close(), adminContext.close()]) }
})

test("MFU Student can request Organizer access and retain Student access while pending", async ({ page }) => {
  await googleLogin(page, `e2e.student.request.${Date.now()}@lamduan.mfu.ac.th`)
  await page.getByLabel("University ID", { exact: true }).fill(`REQ-${Date.now()}`)
  await page.getByRole("button", { name: "Continue to campus", exact: true }).click()
  await page.getByRole("navigation").getByRole("button", { name: "Organizer access", exact: true }).click()
  await page.getByLabel("Club or organization", { exact: true }).fill("MFU Student Club")
  await page.getByLabel("Why do you need Organizer access?", { exact: true }).fill("I want to organize activities for our university club.")
  await page.getByRole("button", { name: "Submit Organizer request", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Pending Admin approval", exact: true })).toBeVisible()
  await page.getByRole("navigation").getByRole("button", { name: "My registrations", exact: true }).click()
  await expect(page.getByRole("heading", { name: "My registrations", exact: true })).toBeVisible()
  await page.setViewportSize({ width: 768, height: 900 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
  await page.getByRole("button", { name: "Toggle navigation", exact: true }).click()
  await page.getByRole("button", { name: "Organizer access", exact: true }).click()
  await page.setViewportSize({ width: 360, height: 800 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
})

test("approved MFU Student can switch workspaces, keep registrations, and publish activities", async ({ browser }) => {
  const studentContext = await browser.newContext()
  const adminContext = await browser.newContext()
  const student = await studentContext.newPage()
  const admin = await adminContext.newPage()
  try {
    const organization = `Dual access club ${Date.now()}`
    await googleLogin(student, `e2e.dual.${Date.now()}@lamduan.mfu.ac.th`)
    await student.getByLabel("University ID", { exact: true }).fill(`DUAL-${Date.now()}`)
    await student.getByRole("button", { name: "Continue to campus", exact: true }).click()
    await student.getByRole("article").filter({ hasText: "Sample: Campus Welcome" }).getByRole("button", { name: "View details", exact: true }).click()
    await student.getByRole("button", { name: "Register now", exact: true }).click()
    await student.getByRole("dialog").getByRole("button", { name: "Confirm", exact: true }).click()
    await expect(student.getByText("You’re registered", { exact: true })).toBeVisible()
    await student.getByRole("navigation").getByRole("button", { name: "Organizer access", exact: true }).click()
    await student.getByLabel("Club or organization", { exact: true }).fill(organization)
    await student.getByLabel("Why do you need Organizer access?", { exact: true }).fill("I am a student who also wants to organize activities for our university club.")
    await student.getByRole("button", { name: "Submit Organizer request", exact: true }).click()
    await expect(student.getByRole("heading", { name: "Pending Admin approval", exact: true })).toBeVisible()
    await login(admin, "admin")
    await admin.getByRole("navigation").getByRole("button", { name: "Organizer requests", exact: true }).click()
    await admin.getByRole("article").filter({ hasText: organization }).getByRole("button", { name: "Approve", exact: true }).click()
    await admin.getByRole("dialog").getByRole("button", { name: "Confirm approval", exact: true }).click()

    // Reload recovers both permissions from the server without another Google login.
    await student.reload()
    await expect(student.getByRole("button", { name: "Switch workspace, current Student", exact: true })).toBeVisible()
    await student.getByRole("navigation").getByRole("button", { name: "My registrations", exact: true }).click()
    const registration = student.getByRole("article").filter({ hasText: "Sample: Campus Welcome" })
    await expect(registration).toBeVisible()
    await registration.getByRole("button", { name: "Cancel", exact: true }).click()
    await student.getByRole("dialog").getByRole("button", { name: "Cancel registration", exact: true }).click()
    await expect(registration).toHaveCount(0)

    await switchWorkspace(student, 'Organizer')
    await expect(student.getByRole("heading", { name: "My activities", exact: true })).toBeVisible()
    await student.reload()
    await expect(student.getByRole("button", { name: "Switch workspace, current Organizer", exact: true })).toBeVisible()
    await student.getByRole("navigation").getByRole("button", { name: "Create activity", exact: true }).click()
    const title = `Student organized activity ${Date.now()}`
    await student.getByLabel("Activity title", { exact: true }).fill(title)
    await student.getByLabel("Description", { exact: true }).fill("An enrolled student can organize and still participate in campus life.")
    await student.getByLabel("Location", { exact: true }).fill("Student club room")
    await student.getByLabel("Date", { exact: true }).fill("2027-03-17")
    await student.getByLabel("Start time", { exact: true }).fill("15:00")
    await student.getByRole("button", { name: "Publish activity", exact: true }).click()
    await expect(student.getByRole("article").filter({ hasText: title }).getByText("PUBLISHED", { exact: true })).toBeVisible()

    await student.setViewportSize({ width: 360, height: 800 })
    await switchWorkspace(student, 'Student')
    await expect(student.getByRole("textbox", { name: "Search activities" })).toBeVisible()
    expect(await student.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
    await student.reload()
    await expect(student.getByRole("button", { name: "Switch workspace, current Student", exact: true })).toBeVisible()
    await student.screenshot({ path: "test-results/student-organizer-mobile.png", fullPage: true })
  } finally { await Promise.all([studentContext.close(), adminContext.close()]) }
})

test("all roles can save their own username, retain edits after errors, and reload their profile", async ({ browser }) => {
  for (const role of ["student", "organizer", "admin"]) {
    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      await login(page, role)
      await expect(page.getByRole("heading", { name: role === "student" ? "Find your next campus moment." : role === "organizer" ? "My activities" : "Campus activity overview", exact: true })).toBeVisible()
      await page.screenshot({ path: `test-results/${role}-workspace-refined.png`, fullPage: true, animations: "disabled" })
      await page.getByRole("navigation").getByRole("button", { name: "My profile", exact: true }).click()
      await expect(page.getByRole("heading", { name: "My profile", exact: true })).toBeVisible()
      await expect(page.getByText(`e2e.${role}@lamduan.mfu.ac.th`, { exact: true })).toBeVisible()
      const input = page.getByRole("textbox", { name: "Username", exact: true })
      const save = page.getByRole("button", { name: "Save changes", exact: true })
      await expect(save).toBeDisabled()
      await expect(page.getByRole("combobox")).toHaveCount(0)
      await input.fill(`Campus ${role} ${Date.now()}`)
      await page.route("**/api/me/profile", route => route.abort())
      await save.click()
      await expect(page.getByRole("alert")).toContainText("could not confirm the change")
      await expect(input).toHaveValue(new RegExp(`Campus ${role}`))
      await page.unroute("**/api/me/profile")
      const name = `  ${role}'s campus name  `
      await input.fill(name)
      await save.click()
      await expect(page.getByRole("status")).toContainText("Username updated.")
      await expect(input).toHaveValue(name.trim())
      await expect(save).toBeDisabled()
      await page.reload()
      await expect(input).toHaveValue(name.trim())
      await input.fill("An unsaved change")
      await page.getByRole("button", { name: "Reset", exact: true }).click()
      await expect(input).toHaveValue(name.trim())
      for (const width of [1440, 1024, 768, 360]) {
        await page.setViewportSize({ width, height: 900 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
        if (width === 1440 || width === 360) await page.screenshot({ path: `test-results/${role}-profile-refined-${width}.png`, fullPage: true, animations: "disabled" })
      }
      await page.getByRole("button", { name: "Toggle navigation", exact: true }).click()
      await page.getByRole("button", { name: "My profile", exact: true }).click()
      await expect(input).toHaveValue(name.trim())
      if (role === "admin") {
        await expect(page.getByText("Admin", { exact: true })).toBeVisible()
        await page.screenshot({ path: "test-results/admin-profile-mobile.png", fullPage: true })
      }
      await page.getByRole("button", { name: "Toggle navigation", exact: true }).click()
      await page.getByRole("button", { name: "Sign out", exact: true }).click()
      await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeVisible()
      // A fresh browser session proves the value lives on the server and avoids
      // reusing Firebase's named popup window from the previous sign-in.
      const freshContext = await browser.newContext()
      try {
        const freshPage = await freshContext.newPage()
        await login(freshPage, role)
        await freshPage.getByRole("navigation").getByRole("button", { name: "My profile", exact: true }).click()
        await expect(freshPage.getByRole("textbox", { name: "Username", exact: true })).toHaveValue(name.trim())
      } finally { await freshContext.close() }
    } finally { await context.close() }
  }
})

test('AI approves a qualifying personal applicant while incomplete applications stay with Admin', async ({ browser }) => {
  const applicantContext = await browser.newContext(), adminContext = await browser.newContext(), pendingContext = await browser.newContext()
  const applicant = await applicantContext.newPage(), admin = await adminContext.newPage(), pending = await pendingContext.newPage()
  try {
    const organization = `E2E AI Campus Collective ${Date.now()}`
    await googleLogin(applicant, `ai.applicant.${Date.now()}@gmail.com`)
    await applicant.getByLabel('Club or organization', { exact: true }).fill(organization)
    await applicant.getByLabel('Why do you need Organizer access?', { exact: true }).fill('I will organize a beginner coding workshop for MFU students to learn programming. I will prepare materials, coordinate volunteers and manage registration.')
    const held = await holdRequest(applicant, '**/api/me/organizer-request', 'POST')
    await applicant.getByRole('button', { name: 'Submit Organizer request', exact: true }).click()
    await held.wait()
    await expect(applicant.getByText('Reviewing your Organizer application', { exact: true })).toBeVisible()
    held.release()
    await expect(applicant.getByRole('heading', { name: 'Organizer access approved', exact: true })).toBeVisible()
    await expect(applicant.getByText(/Approved automatically by AI under/)).toBeVisible()
    await applicant.screenshot({ path: 'test-results/ai-admission-approved.png', fullPage: true, animations: 'disabled' })
    await applicant.getByRole('button', { name: 'Continue to Organizer workspace', exact: true }).click()
    await expect(applicant.getByRole('heading', { name: 'My activities', exact: true })).toBeVisible()
    await expect(applicant.getByRole('button', { name: /^Switch workspace/ })).toHaveCount(0)
    await applicant.reload()
    await expect(applicant.getByRole('heading', { name: 'My activities', exact: true })).toBeVisible()
    await googleLogin(pending, `ai.pending.${Date.now()}@gmail.com`)
    const pendingOrg = `E2E incomplete applicant ${Date.now()}`
    await pending.getByLabel('Club or organization', { exact: true }).fill(pendingOrg)
    await pending.getByLabel('Why do you need Organizer access?', { exact: true }).fill('I would like to organize some activities.')
    await pending.getByRole('button', { name: 'Submit Organizer request', exact: true }).click()
    await expect(pending.getByRole('heading', { name: 'Pending Admin approval', exact: true })).toBeVisible()
    await pending.screenshot({ path: 'test-results/ai-admission-manual.png', fullPage: true, animations: 'disabled' })
    await login(admin, 'admin')
    await admin.getByRole('navigation').getByRole('button', { name: 'Organizer requests', exact: true }).click()
    await expect(admin.getByRole('article').filter({ hasText: pendingOrg })).toContainText('Needs clarification')
    await admin.getByRole('button', { name: 'Approved', exact: true }).click()
    await expect(admin.getByRole('article').filter({ hasText: organization })).toContainText('Approved automatically by AI')
    await admin.screenshot({ path: 'test-results/ai-admission-admin.png', fullPage: true, animations: 'disabled' })
  } finally { await Promise.all([applicantContext.close(), adminContext.close(), pendingContext.close()]) }
})

test('AI planning sections preserve manual fields and require confirmation before replacing facilities', async ({ page }) => {
  await login(page, 'organizer')
  await page.getByRole('navigation').getByRole('button', { name: 'Create activity', exact: true }).click()
  await page.getByLabel('Activity title', { exact: true }).fill('Manual title to preserve')
  await page.getByLabel('Description', { exact: true }).fill('Manual description to preserve.')
  await page.getByLabel('Location', { exact: true }).fill('Manual venue')
  await page.getByLabel('Date', { exact: true }).fill('2027-05-10')
  await page.getByLabel('Start time', { exact: true }).fill('10:30')
  await page.getByLabel('Add facilities requirements', { exact: true }).check()
  await page.getByLabel('Facilities notes', { exact: true }).fill('Existing manual facilities notes')
  await page.getByRole('button', { name: 'Plan with AI', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'AI Event Planning Copilot', exact: true })
  await dialog.getByLabel('Activity idea', { exact: true }).fill(`AI-assisted workshop ${Date.now()}`)
  await dialog.getByLabel('Who is it for?', { exact: true }).fill('MFU beginner students')
  await dialog.getByLabel('Purpose and goals', { exact: true }).fill('Learn coding through guided practical exercises.')
  await dialog.getByRole('button', { name: 'Set duration to 1 hour 30 minutes', exact: true }).click()
  await expect(dialog.getByLabel('Hours', { exact: true })).toHaveValue('1')
  await expect(dialog.getByLabel('Minutes', { exact: true })).toHaveValue('30')
  await dialog.getByLabel('Hours', { exact: true }).fill('0')
  await dialog.getByLabel('Minutes', { exact: true }).fill('5')
  await expect(dialog.getByRole('button', { name: 'Generate event plan', exact: true })).toBeDisabled()
  await expect(dialog).toContainText('Choose a duration between 15 minutes and 8 hours.')
  await dialog.getByRole('button', { name: 'Set duration to 1 hour 30 minutes', exact: true }).click()
  await dialog.getByLabel('Estimated participants', { exact: true }).fill('40')
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  }
  await page.screenshot({ path: 'test-results/planning-duration-input.png', animations: 'disabled' })
  await dialog.getByRole('button', { name: 'Generate event plan', exact: true }).click()
  await expect(dialog.getByText('AI-generated event plan', { exact: true })).toBeVisible()
  await expect(dialog).toContainText('18–90 min')
  await expect(dialog.getByRole('button', { name: 'Apply selected sections', exact: true })).toBeDisabled()
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  }
  await page.screenshot({ path: 'test-results/ai-event-plan.png', animations: 'disabled' })
  await dialog.getByLabel('Title', { exact: true }).uncheck()
  await dialog.getByLabel('Description', { exact: true }).uncheck()
  await dialog.getByRole('button', { name: 'Apply selected sections', exact: true }).click()
  await expect(page.getByLabel('Activity title', { exact: true })).toHaveValue('Manual title to preserve')
  await expect(page.getByLabel('Description', { exact: true })).toHaveValue(/^Manual description to preserve\.[\s\S]*Suggested agenda[\s\S]*Preparation checklist/)
  await expect(page.getByLabel('Facilities notes', { exact: true })).toHaveValue('Existing manual facilities notes')
  await page.getByRole('button', { name: 'Plan with AI', exact: true }).click()
  await dialog.getByRole('button', { name: 'Generate event plan', exact: true }).click()
  await dialog.getByLabel('Timed agenda', { exact: true }).uncheck()
  await dialog.getByLabel('Preparation checklist', { exact: true }).uncheck()
  await dialog.getByLabel('Facilities notes', { exact: true }).check()
  await expect(dialog.getByRole('button', { name: 'Apply selected sections', exact: true })).toBeDisabled()
  await dialog.getByLabel('I reviewed replacing my existing text in the selected fields.', { exact: true }).check()
  await dialog.getByRole('button', { name: 'Apply selected sections', exact: true }).click()
  await expect(page.getByLabel('Facilities notes', { exact: true })).toHaveValue(/Projector/)
  await expect(page.getByLabel('Location', { exact: true })).toHaveValue('Manual venue')
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2027-05-10')
  await expect(page.getByLabel('Start time', { exact: true })).toHaveValue('10:30')
})

test('planning copilot falls back transparently, shows progress, and applies only reviewed content', async ({ page }) => {
  await login(page, 'organizer')
  await page.getByRole('navigation').getByRole('button', { name: 'Create activity', exact: true }).click()
  await page.getByLabel('Location', { exact: true }).fill('Manual venue')
  await page.getByLabel('Date', { exact: true }).fill('2027-05-10')
  await page.getByLabel('Start time', { exact: true }).fill('10:30')
  await page.getByRole('button', { name: 'Plan with AI', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const topic = `Timeout fixture: Beginner Python workshop ${Date.now()}`
  await dialog.getByLabel('Activity idea', { exact: true }).fill(topic)
  await dialog.getByLabel('Who is it for?', { exact: true }).fill('MFU students new to programming')
  await dialog.getByLabel('Purpose and goals', { exact: true }).fill('Learn the basics of Python and build a small program together.')
  const held = await holdRequest(page, '**/api/me/activity-plan', 'POST')
  try {
    await dialog.getByRole('button', { name: 'Generate event plan', exact: true }).click()
    await held.wait()
    await expect(dialog.getByText('Building your event plan', { exact: true })).toBeVisible()
    await expectSingleProgress(dialog, 'Generate event plan')
    await expect(dialog.getByRole('button', { name: 'Close dialog', exact: true })).toBeDisabled()
    await page.screenshot({ path: 'test-results/ai-draft-loading.png', fullPage: true, animations: 'disabled' })
    held.release()
    await expect(dialog.getByText('Starter plan', { exact: true })).toBeVisible()
    await expect(dialog).toContainText('AI is taking longer than expected.')
    await expect(dialog.getByRole('heading', { name: topic, exact: true })).toBeVisible()
    await page.screenshot({ path: 'test-results/ai-template-preview.png', fullPage: true, animations: 'disabled' })
    await dialog.getByRole('button', { name: 'Apply selected sections', exact: true }).click()
    await expect(page.getByLabel('Activity title', { exact: true })).toHaveValue(topic)
    await expect(page.getByLabel('Description', { exact: true })).toHaveValue(/Suggested agenda/)
    await expect(page.getByLabel('Location', { exact: true })).toHaveValue('Manual venue')
    await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2027-05-10')
    await expect(page.getByLabel('Start time', { exact: true })).toHaveValue('10:30')
    await page.getByRole('button', { name: 'Publish activity', exact: true }).click()
    await expect(page.getByRole('article').filter({ hasText: topic }).getByText('PUBLISHED', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('article').filter({ hasText: topic })).toBeVisible()
    await page.getByRole('article').filter({ hasText: topic }).getByRole('button', { name: topic, exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Suggested agenda (120 minutes)', exact: true })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Activity agenda', exact: true }).getByRole('listitem')).toHaveCount(3)
    const preparation = page.getByText('Preparation checklist', { exact: true })
    const task = page.getByText('Confirm venue and equipment availability with the responsible team.', { exact: true })
    await expect(task).not.toBeVisible()
    await preparation.click()
    await expect(page.getByRole('heading', { name: 'before', exact: true })).toBeVisible()
    await expect(task).toBeVisible()
    await preparation.click()
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    }
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }))
    await page.screenshot({ path: 'test-results/activity-description-readable.png', fullPage: true, animations: 'disabled' })
    await page.setViewportSize({ width: 360, height: 900 })
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }))
    await page.screenshot({ path: 'test-results/activity-description-readable-mobile.png', fullPage: true, animations: 'disabled' })
  } finally { held.release() }
})

test('loading states cover session, data, refresh, profile save, registration and cancellation', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  const gates: Awaited<ReturnType<typeof holdRequest>>[] = []
  const hold = async (pattern: string, method?: string) => { const gate = await holdRequest(page, pattern, method); gates.push(gate); return gate }
  try {
    const session = await hold('**/api/me')
    const activities = await hold('**/api/activities?**')
    await googleLogin(page, 'e2e.student@lamduan.mfu.ac.th')
    await session.wait()
    await expect(page.getByRole('heading', { name: 'Opening your workspace', exact: true })).toBeVisible()
    await page.screenshot({ path: 'test-results/session-loading.png', fullPage: true, animations: 'disabled' })
    session.release()
    await activities.wait()
    await expect(page.getByText('Loading campus activities', { exact: true })).toBeVisible()
    await page.screenshot({ path: 'test-results/activities-loading.png', fullPage: true, animations: 'disabled' })
    activities.release()
    await expect(page.getByRole('heading', { name: 'Find your next campus moment.', exact: true })).toBeVisible()

    const refresh = await hold('**/api/activities?**')
    await page.getByRole('button', { name: 'Refresh activities', exact: true }).click()
    await refresh.wait()
    await expect(page.getByText('Updating this list…', { exact: true })).toBeVisible()
    await expect(page.getByRole('article').first()).toBeVisible()
    await expectSingleProgress(page, 'Refresh activities')
    refresh.release()
    await expect(page.getByRole('button', { name: 'Refresh activities', exact: true })).toBeEnabled()

    const profile = await hold('**/api/me')
    await page.getByRole('navigation').getByRole('button', { name: 'My profile', exact: true }).click()
    await profile.wait()
    await expect(page.getByText('Loading your campus profile', { exact: true })).toBeVisible()
    await page.setViewportSize({ width: 360, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
    await page.screenshot({ path: 'test-results/profile-loading-mobile.png', fullPage: true, animations: 'disabled' })
    await page.setViewportSize({ width: 1440, height: 900 })
    profile.release()
    await expect(page.getByLabel('Username', { exact: true })).toBeVisible()
    const save = await hold('**/api/me/profile', 'PATCH')
    await page.getByLabel('Username', { exact: true }).fill('Student loading check')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await save.wait()
    await expect(page.getByText('Saving your username', { exact: true })).toBeVisible()
    await expectSingleProgress(page, 'Save changes')
    await page.screenshot({ path: 'test-results/profile-saving.png', fullPage: true, animations: 'disabled' })
    save.release()
    await expect(page.getByText('Username updated.', { exact: true })).toBeVisible()

    await page.getByRole('navigation').getByRole('button', { name: 'Discover', exact: true }).click()
    await page.getByRole('article').filter({ hasText: 'Sample: Campus Welcome' }).getByRole('button', { name: 'View details', exact: true }).click()
    await page.getByRole('button', { name: 'Register now', exact: true }).click()
    const register = await hold('**/api/activities/sample-welcome/registrations', 'POST')
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click()
    await register.wait()
    await expect(page.getByText('Confirming your registration', { exact: true })).toBeVisible()
    await expectSingleProgress(page.getByRole('dialog'), 'Confirm')
    register.release()
    await expect(page.getByText('You’re registered', { exact: true })).toBeVisible()
    await page.getByRole('navigation').getByRole('button', { name: 'My registrations', exact: true }).click()
    await page.getByRole('article').filter({ hasText: 'Sample: Campus Welcome' }).getByRole('button', { name: 'Cancel', exact: true }).click()
    const cancel = await hold('**/api/registrations/*/cancel', 'PATCH')
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel registration', exact: true }).click()
    await cancel.wait()
    await expect(page.getByText('Cancelling your registration', { exact: true })).toBeVisible()
    await expectSingleProgress(page.getByRole('dialog'), 'Cancel registration')
    cancel.release()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('article').filter({ hasText: 'Sample: Campus Welcome' })).toHaveCount(0)
  } finally { for (const gate of gates) gate.release(); await context.close() }
})

test('Organizer refresh and Admin decisions keep one progress announcement and disabled original actions', async ({ browser }) => {
  const organizerContext = await browser.newContext(), applicantContext = await browser.newContext(), adminContext = await browser.newContext()
  const organizer = await organizerContext.newPage(), applicant = await applicantContext.newPage(), admin = await adminContext.newPage()
  const gates: Awaited<ReturnType<typeof holdRequest>>[] = []
  try {
    await publishTicketEvent(organizer, 'Progress feedback workshop')
    const refresh = await holdRequest(organizer, '**/api/me/activities?**'); gates.push(refresh)
    await organizer.getByRole('button', { name: 'Refresh activities', exact: true }).click()
    await refresh.wait()
    await expect(organizer.getByText('Updating this list…', { exact: true })).toBeVisible()
    await expectSingleProgress(organizer, 'Refresh activities')
    await expect(organizer.getByText('Refreshing your activities', { exact: true })).toHaveCount(0)
    refresh.release()
    await expect(organizer.getByRole('button', { name: 'Refresh activities', exact: true })).toBeEnabled()

    const organization = `Progress review ${Date.now()}`
    await googleLogin(applicant, `progress.${Date.now()}@gmail.com`)
    await applicant.getByLabel('Club or organization', { exact: true }).fill(organization)
    await applicant.getByLabel('Why do you need Organizer access?', { exact: true }).fill('I would like to organize a campus workshop and need more guidance.')
    const submit = await holdRequest(applicant, '**/api/me/organizer-request', 'POST'); gates.push(submit)
    await applicant.getByRole('button', { name: 'Submit Organizer request', exact: true }).click()
    await submit.wait()
    await expectSingleProgress(applicant, 'Submit Organizer request')
    submit.release()
    await expect(applicant.getByRole('heading', { name: 'Pending Admin approval', exact: true })).toBeVisible()

    await login(admin, 'admin')
    await admin.getByRole('navigation').getByRole('button', { name: 'Organizer requests', exact: true }).click()
    const card = admin.getByRole('article').filter({ hasText: organization })
    await expect(card).toBeVisible()
    const queue = await holdRequest(admin, '**/api/admin/organizer-requests?**'); gates.push(queue)
    await admin.getByRole('button', { name: 'Refresh requests', exact: true }).click()
    await queue.wait()
    await expectSingleProgress(admin, 'Refresh requests')
    queue.release()
    await expect(admin.getByRole('button', { name: 'Refresh requests', exact: true })).toBeEnabled()
    await card.getByRole('button', { name: 'Approve', exact: true }).click()
    const decision = await holdRequest(admin, '**/api/admin/organizer-requests/*', 'PATCH'); gates.push(decision)
    const dialog = admin.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Confirm approval', exact: true }).click()
    await decision.wait()
    await expectSingleProgress(dialog, 'Confirm approval')
    await expect(dialog.getByRole('button', { name: 'Close dialog', exact: true })).toBeDisabled()
    decision.release()
    await expect(admin.getByRole('dialog')).toHaveCount(0)
  } finally { for (const gate of gates) gate.release(); await organizerContext.close(); await applicantContext.close(); await adminContext.close() }
})

test('Library learning resources use relevance-gated AI search, real catalog cards and manual fallback', async ({ browser }) => {
  const organizer = await browser.newContext(), student = await browser.newContext();
  const organizerPage = await organizer.newPage(), page = await student.newPage();
  try {
    const title = await publishTicketEvent(organizerPage, 'Library Python workshop');
    const fallbackTitle = await publishTicketEvent(organizerPage, 'Python fallback workshop', true);
    const welcomeTitle = await publishTicketEvent(organizerPage, 'Fresher Welcome for Burmese Students', true, 'Welcome');
    await login(page, 'student');
    const relevance = await holdRequest(page, '**/api/activities/*/library-resources/relevance');
    await page.getByRole('textbox', { name: 'Search activities' }).fill(title);
    await page.getByRole('article').filter({ hasText: title }).getByRole('button', { name: 'View details' }).click();
    const panel = page.getByRole('region', { name: 'Learning resources', exact: true });
    await expect(panel).toBeVisible(); await expect(panel.getByRole('article')).toHaveCount(0);
    await relevance.wait();
    await expect(panel.getByRole('button', { name: 'Find learning resources', exact: true })).toHaveCount(0);
    await expect(panel.getByText('Checking for related reading…', { exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Search Library', exact: true })).toBeEnabled();
    relevance.release();
    const paused = await holdRequest(page, '**/api/activities/*/library-resources/suggest', 'POST');
    await panel.getByRole('button', { name: 'Find learning resources', exact: true }).click();
    await paused.wait();
    await expect(panel.getByText('Finding learning resources', { exact: true })).toBeVisible();
    paused.release();
    await expect(panel.getByRole('article')).toHaveCount(4);
    await expect(panel.getByText(/AI-assisted search/)).toContainText('Python');
    await expect(panel.getByText('No copies available', { exact: true })).toHaveCount(2);
    await expect(panel.getByRole('article').first().getByRole('link')).toHaveAttribute('href', /^https:\/\/library\.test\/books\//);
    await expect(panel.getByRole('article').first().getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: 'test-results/library-resources-desktop.png', fullPage: true, animations: 'disabled' });
    await panel.getByRole('button', { name: 'Next resources', exact: true }).click();
    await expect(panel.getByRole('article')).toHaveCount(2);
    await expect(panel.getByRole('button', { name: 'Next resources', exact: true })).toBeDisabled();
    await panel.getByLabel('Search Library manually').fill('no-match');
    await panel.getByRole('button', { name: 'Search Library', exact: true }).click();
    await expect(panel.getByRole('heading', { name: 'No Library resources found', exact: true })).toBeVisible();
    await panel.getByLabel('Search Library manually').fill('unavailable');
    await panel.getByRole('button', { name: 'Search Library', exact: true }).click();
    await expect(panel.getByRole('alert')).toContainText('temporarily unavailable');
    await expect(panel.getByRole('article')).toHaveCount(0);
    await panel.getByLabel('Search Library manually').fill('Python');
    await panel.getByRole('button', { name: 'Search Library', exact: true }).click();
    await expect(panel.getByRole('article')).toHaveCount(4);
    await expect(panel.getByText(/Library search:/)).toBeVisible();
    for (const width of [360, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy() }
    await page.getByRole('button', { name: 'Back to activities', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search activities' }).fill(fallbackTitle);
    await page.getByRole('article').filter({ hasText: fallbackTitle }).getByRole('button', { name: 'View details' }).click();
    await expect(panel.getByRole('article')).toHaveCount(0);
    await expect(panel.getByText('Checking for related reading…', { exact: true })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Find learning resources', exact: true })).toHaveCount(0);
    await panel.getByLabel('Search Library manually').fill('Python');
    await panel.getByRole('button', { name: 'Search Library', exact: true }).click();
    await expect(panel.getByRole('article')).toHaveCount(4);
    await page.setViewportSize({ width: 360, height: 900 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: 'test-results/library-resources-mobile-fallback.png', fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Back to activities', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search activities' }).fill(welcomeTitle);
    await page.getByRole('article').filter({ hasText: welcomeTitle }).getByRole('button', { name: 'View details' }).click();
    await expect(panel).toBeVisible();
    await expect(panel.getByText('Checking for related reading…', { exact: true })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Find learning resources', exact: true })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Search Library', exact: true })).toBeEnabled();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: 'test-results/library-welcome-no-ai.png', fullPage: true, animations: 'disabled' });
  } finally { await organizer.close(); await student.close() }
});

test('Student internships use the protected partner feed with search, pagination, demo labels and honest recovery', async ({ page }) => {
  await login(page, 'student')
  let release!: () => void
  const ready = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/internships?*', async route => { await ready; await route.continue() })
  await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('button', { name: 'Internships', exact: true }).click()
  await expect(page.getByText('Finding internship opportunities', { exact: true })).toBeVisible()
  release()
  await expect(page.getByRole('article')).toHaveCount(6)
  await expect(page.getByRole('article').getByText('Demo listing', { exact: true })).toHaveCount(6)
  await expect(page.getByText('Application deadline · Thailand', { exact: true })).toHaveCount(6)
  await expect(page.getByText('Allowance not specified', { exact: true })).toHaveCount(3)
  const external = page.getByRole('article').first().getByRole('link')
  await expect(external).toHaveAttribute('href', /^https:\/\/team17\.test\/opportunities\//)
  await expect(external).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(page.getByRole('button', { name: 'Register now', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Next page', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled()
  await page.getByLabel('Search internships', { exact: true }).fill('React')
  await page.getByLabel('Work arrangement', { exact: true }).selectOption('remote')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(4)
  await expect(page.getByText('4 opportunities', { exact: true })).toBeVisible()
  await page.getByLabel('Search internships', { exact: true }).fill('no-matching-opportunity')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'No internships found', exact: true })).toBeVisible()
  await page.getByLabel('Search internships', { exact: true }).fill('unavailable')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable')
  await expect(page.getByRole('article')).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(6)
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  }
  await page.screenshot({ path: 'test-results/internships-desktop.png', fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 360, height: 900 })
  await page.getByRole('button', { name: 'Toggle navigation', exact: true }).click()
  await expect(page.locator('#mobile-navigation').getByRole('button', { name: 'Internships', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.keyboard.press('Escape')
  await page.screenshot({ path: 'test-results/internships-mobile.png', fullPage: true, animations: 'disabled' })
})
