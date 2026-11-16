import { Link } from '@tanstack/react-router';
import { useRealtime } from '../app/providers/RealtimeProvider';
import { roleProfiles, type RoleProfileKey, SYSTEM_FLOW_STEPS } from '@shared/roleProfiles';

interface RoleDashboardProps {
  profileKey: RoleProfileKey;
}

export function RoleDashboard({ profileKey }: RoleDashboardProps) {
  const profile = roleProfiles[profileKey];
  const { isConnected } = useRealtime();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{profile.platform}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.roleTitle}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{profile.workflowLabel}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? 'Live connection active' : 'Reconnecting…'}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Purpose</h2>
          <p className="text-gray-600 dark:text-gray-400">{profile.purpose}</p>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Main function
          </h3>
          <p className="text-gray-800 dark:text-gray-200 font-medium">{profile.mainFunction}</p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your responsibilities</h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            {profile.responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick access</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.navigation
            .filter((item) => item.path !== '/dashboard')
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40 transition"
              >
                {item.name}
              </Link>
            ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Overall system flow</h2>
        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {SYSTEM_FLOW_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
