import { useEffect, useState } from 'react';
import { bootstrapCoreForProject, type CoreBusinessSnapshot } from '@/core/services/platformFacade';
import { Metrics, Project } from '@/types/business';

export function useAutonomousOS(project: Project | null, metrics: Metrics[]) {
  const [snapshot, setSnapshot] = useState<CoreBusinessSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!project) {
        if (isMounted) setSnapshot(null);
        return;
      }

      const nextSnapshot = await bootstrapCoreForProject(project, metrics);
      if (isMounted) {
        setSnapshot(nextSnapshot);
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [project, metrics]);

  return snapshot;
}
