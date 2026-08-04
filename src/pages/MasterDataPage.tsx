import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Banner } from '../components/timesheet/Banner';
import { useDepartments, useLocations, useAccounts, useProjects, useModules } from '../hooks/api/useMasterData';

export function MasterDataPage() {
  const departments = useDepartments();
  const locations = useLocations();
  const accounts = useAccounts();
  const projects = useProjects();
  const modules = useModules();

  const isLoading = departments.isLoading || locations.isLoading || accounts.isLoading || projects.isLoading || modules.isLoading;
  const isError = departments.isError || locations.isError || accounts.isError || projects.isError || modules.isError;

  const deptName = (id: number) => departments.data?.find((d) => d.id === id)?.name ?? '—';
  const accName = (id: number) => accounts.data?.find((a) => a.id === id)?.name ?? '—';
  const moduleCountFor = (projectId: number) => modules.data?.filter((m) => m.projectId === projectId).length ?? 0;

  return (
    <>
      <PageHeader crumb="Setup" title="Master Data" />
      <div className="page-content">
        {isLoading && <Banner>Loading reference data…</Banner>}
        {isError && <Banner kind="reject">Couldn't load master data — check that the backend API is reachable.</Banner>}

        {!isLoading && !isError && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Departments" sub={`${departments.data?.length ?? 0} total`}>
              <table style={{ width: '100%', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--slate)', fontSize: 10.5, textTransform: 'uppercase' }}>
                    <th style={{ paddingBottom: 6 }}>Code</th>
                    <th style={{ paddingBottom: 6 }}>Name</th>
                    <th style={{ paddingBottom: 6 }}>Parent</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.data?.map((d) => (
                    <tr key={d.id}>
                      <td className="num" style={{ padding: '4px 0' }}>{d.code}</td>
                      <td>{d.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{d.parentDepartmentId ? deptName(d.parentDepartmentId) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="Locations" sub={`${locations.data?.length ?? 0} total`}>
              <table style={{ width: '100%', fontSize: 12.5 }}>
                <tbody>
                  {locations.data?.map((l) => (
                    <tr key={l.id}>
                      <td className="num" style={{ padding: '4px 0', width: 100 }}>{l.code}</td>
                      <td>{l.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="Accounts" sub={`${accounts.data?.length ?? 0} total — placeholder data, pending real client list`}>
              <table style={{ width: '100%', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--slate)', fontSize: 10.5, textTransform: 'uppercase' }}>
                    <th style={{ paddingBottom: 6 }}>Name</th>
                    <th style={{ paddingBottom: 6 }}>Department</th>
                    <th style={{ paddingBottom: 6 }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.data?.map((a) => (
                    <tr key={a.id}>
                      <td style={{ padding: '4px 0' }}>{a.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{deptName(a.departmentId)}</td>
                      <td style={{ color: 'var(--slate)' }}>{a.accountType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="Projects" sub={`${projects.data?.length ?? 0} total — placeholder data, pending real project list`}>
              <table style={{ width: '100%', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--slate)', fontSize: 10.5, textTransform: 'uppercase' }}>
                    <th style={{ paddingBottom: 6 }}>Code</th>
                    <th style={{ paddingBottom: 6 }}>Name</th>
                    <th style={{ paddingBottom: 6 }}>Account</th>
                    <th style={{ paddingBottom: 6 }}>Billable</th>
                    <th style={{ paddingBottom: 6 }}>Modules</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.data?.map((p) => (
                    <tr key={p.id}>
                      <td className="num" style={{ padding: '4px 0' }}>{p.code}</td>
                      <td>{p.name}</td>
                      <td style={{ color: 'var(--slate)' }}>{accName(p.accountId)}</td>
                      <td style={{ color: 'var(--slate)' }}>{p.defaultBillable ? 'Yes' : 'No'}</td>
                      <td className="num" style={{ color: 'var(--slate)' }}>{moduleCountFor(p.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
