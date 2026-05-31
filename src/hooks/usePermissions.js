import { useProject } from '../context/ProjectContext'

/**
 * Small, focused permissions hook extracted from currentUserScope (item #4).
 * Makes permission checks much cleaner across the app.
 *
 * Usage:
 *   const { isAdmin, canAccessClient, hasMultipleClients } = usePermissions()
 */
export function usePermissions() {
  const { isAdmin, currentUserScope, myClientSlugs, hasMultipleClients, canAccessClient } = useProject()

  return {
    isAdmin,
    hasMultipleClients,
    myClientSlugs,
    canAccessClient,
    // Convenience: does the current user have access to the given client slug?
    canAccess: (slug) => canAccessClient(slug),
    // For future expansion (e.g. specific roles)
    currentUserScope,
  }
}
