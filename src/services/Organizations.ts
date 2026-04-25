// Temporary Organizations service: returns a static list of organizations
// TODO: Replace with DB-backed implementation when Organization model is added

export type Organization = {
  id: string
  title: string
}

const ORGS: Organization[] = [
  { id: "org_global", title: "Global" },
  { id: "org_elections", title: "Elections Commission" },
  { id: "org_observers", title: "Observers" },
]

export const getOrganizations = async (): Promise<Organization[]> => {
  // Simulate async operation
  return Promise.resolve(ORGS)
}
