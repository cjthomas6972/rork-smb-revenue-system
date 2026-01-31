import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Project,
  Metrics,
  RevenueAsset,
  ContentItem,
  Task,
  WeeklyMission,
  MonthlyMilestone,
  UserSettings,
  DailyDirective,
  AdvisorDirective,
  FocusMode,
  FocusArea,
  PrimaryProblem,
} from '@/types/business';

const STORAGE_KEYS = {
  PROJECTS: 'skyforge_projects',
  ACTIVE_PROJECT_ID: 'skyforge_active_project_id',
  METRICS: 'skyforge_metrics',
  ASSETS: 'skyforge_assets',
  CONTENT: 'skyforge_content',
  TASKS: 'skyforge_tasks',
  WEEKLY_MISSION: 'skyforge_weekly_mission',
  MONTHLY_MILESTONE: 'skyforge_monthly_milestone',
  ONBOARDING_COMPLETE: 'skyforge_onboarding_complete',
  USER_SETTINGS: 'skyforge_user_settings',
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  displayName: 'Skyforge User',
  theme: 'dark',
};

export const [BusinessProvider, useBusiness] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
      return stored ? JSON.parse(stored) as Project[] : [];
    },
  });

  const userSettingsQuery = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return stored ? JSON.parse(stored) as UserSettings : DEFAULT_USER_SETTINGS;
    },
  });

  const metricsQuery = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.METRICS);
      return stored ? JSON.parse(stored) as Metrics[] : [];
    },
  });

  const assetsQuery = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ASSETS);
      return stored ? JSON.parse(stored) as RevenueAsset[] : [];
    },
  });

  const contentQuery = useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONTENT);
      return stored ? JSON.parse(stored) as ContentItem[] : [];
    },
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      return stored ? JSON.parse(stored) as Task[] : [];
    },
  });

  const weeklyMissionQuery = useQuery({
    queryKey: ['weeklyMission'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_MISSION);
      return stored ? JSON.parse(stored) as WeeklyMission[] : [];
    },
  });

  const monthlyMilestoneQuery = useQuery({
    queryKey: ['monthlyMilestone'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_MILESTONE);
      return stored ? JSON.parse(stored) as MonthlyMilestone[] : [];
    },
  });

  useEffect(() => {
    const loadInitialState = async () => {
      const [onboardingValue, activeId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID),
      ]);
      setIsOnboardingComplete(onboardingValue === 'true');
      setActiveProjectId(activeId);
    };
    loadInitialState();
  }, []);

  const projects = projectsQuery.data ?? [];
  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const projectMetrics = useMemo(() => 
    (metricsQuery.data ?? []).filter(m => m.projectId === activeProjectId),
    [metricsQuery.data, activeProjectId]
  );

  const projectAssets = useMemo(() => 
    (assetsQuery.data ?? []).filter(a => a.projectId === activeProjectId),
    [assetsQuery.data, activeProjectId]
  );

  const projectContent = useMemo(() => 
    (contentQuery.data ?? []).filter(c => c.projectId === activeProjectId),
    [contentQuery.data, activeProjectId]
  );

  const projectTasks = useMemo(() => 
    (tasksQuery.data ?? []).filter(t => t.projectId === activeProjectId),
    [tasksQuery.data, activeProjectId]
  );

  const projectWeeklyMission = useMemo(() => 
    (weeklyMissionQuery.data ?? []).find(m => m.projectId === activeProjectId) ?? null,
    [weeklyMissionQuery.data, activeProjectId]
  );

  const projectMonthlyMilestone = useMemo(() => 
    (monthlyMilestoneQuery.data ?? []).find(m => m.projectId === activeProjectId) ?? null,
    [monthlyMilestoneQuery.data, activeProjectId]
  );

  const createProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      const current = projectsQuery.data || [];
      const updated = [...current, project];
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, project.id);
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
      return { projects: updated, activeId: project.id };
    },
    onSuccess: ({ projects, activeId }) => {
      queryClient.setQueryData(['projects'], projects);
      setActiveProjectId(activeId);
      setIsOnboardingComplete(true);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const current = projectsQuery.data || [];
      const updated = current.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (projects) => {
      queryClient.setQueryData(['projects'], projects);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = projectsQuery.data || [];
      const updated = current.filter(p => p.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      
      if (activeProjectId === id) {
        const newActiveId = updated.length > 0 ? updated[0].id : null;
        if (newActiveId) {
          await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, newActiveId);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
        }
        return { projects: updated, newActiveId };
      }
      return { projects: updated, newActiveId: activeProjectId };
    },
    onSuccess: ({ projects, newActiveId }) => {
      queryClient.setQueryData(['projects'], projects);
      setActiveProjectId(newActiveId);
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = projectsQuery.data || [];
      const updated = current.map(p => 
        p.id === id ? { ...p, status: 'archived' as const, updatedAt: new Date().toISOString() } : p
      );
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (projects) => {
      queryClient.setQueryData(['projects'], projects);
    },
  });

  const switchProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, projectId);
      return projectId;
    },
    onSuccess: (projectId) => {
      setActiveProjectId(projectId);
    },
  });

  const updateFocusModeMutation = useMutation({
    mutationFn: async ({ projectId, focusMode, manualFocusArea }: { 
      projectId: string; 
      focusMode: FocusMode; 
      manualFocusArea?: FocusArea 
    }) => {
      const current = projectsQuery.data || [];
      const updated = current.map(p => {
        if (p.id === projectId) {
          return { 
            ...p, 
            focusMode, 
            manualFocusArea: focusMode === 'manual' ? manualFocusArea : undefined,
            updatedAt: new Date().toISOString() 
          };
        }
        return p;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (projects) => {
      queryClient.setQueryData(['projects'], projects);
    },
  });

  const updateDailyDirectiveMutation = useMutation({
    mutationFn: async ({ projectId, directive }: { projectId: string; directive: DailyDirective }) => {
      const current = projectsQuery.data || [];
      const updated = current.map(p => 
        p.id === projectId ? { ...p, dailyDirective: directive, updatedAt: new Date().toISOString() } : p
      );
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (projects) => {
      queryClient.setQueryData(['projects'], projects);
    },
  });

  const completeDailyDirectiveMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const current = projectsQuery.data || [];
      const updated = current.map(p => {
        if (p.id === projectId && p.dailyDirective) {
          return { 
            ...p, 
            dailyDirective: { ...p.dailyDirective, status: 'complete' as const },
            updatedAt: new Date().toISOString() 
          };
        }
        return p;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (projects) => {
      queryClient.setQueryData(['projects'], projects);
    },
  });

  const updateAdvisorDirectiveMutation = useMutation({
    mutationFn: async ({ projectId, directive }: { projectId: string; directive: AdvisorDirective }) => {
      const current = projectsQuery.data || [];
      const updated = current.map(p => 
        p.id === projectId ? { ...p, advisorDirective: directive, updatedAt: new Date().toISOString() } : p
      );
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (projects) => {
      queryClient.setQueryData(['projects'], projects);
    },
  });

  const updateUserSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const current = userSettingsQuery.data || DEFAULT_USER_SETTINGS;
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(['userSettings'], settings);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'false');
      return true;
    },
    onSuccess: () => {
      setActiveProjectId(null);
      setIsOnboardingComplete(false);
    },
  });

  const addMetricsMutation = useMutation({
    mutationFn: async (metrics: Metrics) => {
      const current = metricsQuery.data || [];
      const updated = [...current, metrics];
      await AsyncStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (metrics) => {
      queryClient.setQueryData(['metrics'], metrics);
    },
  });

  const addAssetMutation = useMutation({
    mutationFn: async (asset: RevenueAsset) => {
      const current = assetsQuery.data || [];
      const updated = [...current, asset];
      await AsyncStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (assets) => {
      queryClient.setQueryData(['assets'], assets);
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RevenueAsset> }) => {
      const current = assetsQuery.data || [];
      const updated = current.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
      await AsyncStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (assets) => {
      queryClient.setQueryData(['assets'], assets);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = assetsQuery.data || [];
      const updated = current.filter((a) => a.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (assets) => {
      queryClient.setQueryData(['assets'], assets);
    },
  });

  const addContentMutation = useMutation({
    mutationFn: async (content: ContentItem) => {
      const current = contentQuery.data || [];
      const updated = [...current, content];
      await AsyncStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (content) => {
      queryClient.setQueryData(['content'], content);
    },
  });

  const setTasksMutation = useMutation({
    mutationFn: async (tasks: Task[]) => {
      const current = tasksQuery.data || [];
      const otherTasks = current.filter(t => t.projectId !== activeProjectId);
      const updated = [...otherTasks, ...tasks];
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (tasks) => {
      queryClient.setQueryData(['tasks'], tasks);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = tasksQuery.data || [];
      const updated = current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (tasks) => {
      queryClient.setQueryData(['tasks'], tasks);
    },
  });

  const setWeeklyMissionMutation = useMutation({
    mutationFn: async (mission: WeeklyMission) => {
      const current = weeklyMissionQuery.data || [];
      const otherMissions = current.filter(m => m.projectId !== activeProjectId);
      const updated = [...otherMissions, mission];
      await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_MISSION, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (missions) => {
      queryClient.setQueryData(['weeklyMission'], missions);
    },
  });

  const setMonthlyMilestoneMutation = useMutation({
    mutationFn: async (milestone: MonthlyMilestone) => {
      const current = monthlyMilestoneQuery.data || [];
      const otherMilestones = current.filter(m => m.projectId !== activeProjectId);
      const updated = [...otherMilestones, milestone];
      await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_MILESTONE, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (milestones) => {
      queryClient.setQueryData(['monthlyMilestone'], milestones);
    },
  });

  const getCurrentFocus = useCallback((): string => {
    if (!activeProject) return 'leads';
    if (activeProject.focusMode === 'manual' && activeProject.manualFocusArea) {
      return activeProject.manualFocusArea;
    }
    return activeProject.bottleneck || 'leads';
  }, [activeProject]);

  const generateDailyDirective = useCallback((focus: string): DailyDirective => {
    const directives: Record<string, DailyDirective> = {
      leads: {
        id: Date.now().toString(),
        title: 'Record 1 short-form video addressing a pain point',
        description: 'Create a 30-60 second video that speaks directly to your ideal customer\'s biggest frustration. Use a hook that grabs attention in the first 3 seconds.',
        reason: 'Your main bottleneck is lead generation. This task directly increases your visibility and attracts potential customers.',
        estimatedTime: '20-30 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      content: {
        id: Date.now().toString(),
        title: 'Write and schedule 3 social posts',
        description: 'Create 3 value-driven posts: 1 educational tip, 1 customer success story or testimonial, and 1 behind-the-scenes look at your process.',
        reason: 'Consistent content builds trust and keeps you top-of-mind with your audience.',
        estimatedTime: '30-45 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      outreach: {
        id: Date.now().toString(),
        title: 'Send 10 personalized DMs to potential clients',
        description: 'Identify 10 people who fit your ideal customer profile and send them a genuine, non-salesy message. Start a conversation, don\'t pitch.',
        reason: 'Direct outreach is the fastest path to new conversations and opportunities.',
        estimatedTime: '30-40 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      offer: {
        id: Date.now().toString(),
        title: 'Refine your core offer statement',
        description: 'Write out: Who you help, what specific result you deliver, and why you\'re the best choice. Keep it under 2 sentences.',
        reason: 'A clear, compelling offer is the foundation of all your marketing. Get this right and everything else becomes easier.',
        estimatedTime: '20-30 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      pricing: {
        id: Date.now().toString(),
        title: 'Review and test a new pricing angle',
        description: 'Consider: package deals, payment plans, or value-based pricing. Pick one and draft a new pricing option to test.',
        reason: 'Pricing directly impacts your revenue. Small changes can lead to significant gains.',
        estimatedTime: '15-25 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      conversion: {
        id: Date.now().toString(),
        title: 'Optimize your booking or checkout flow',
        description: 'Walk through your own process as a customer. Identify and remove any friction points. Make it easier to say yes.',
        reason: 'You\'re getting traffic but losing people at the conversion step. Simplify and watch your numbers improve.',
        estimatedTime: '25-35 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      fulfillment: {
        id: Date.now().toString(),
        title: 'Document one key process in your delivery',
        description: 'Pick one recurring task in how you serve clients and write out the exact steps. This is the start of your operations playbook.',
        reason: 'Systematizing your delivery frees up time and ensures consistent quality.',
        estimatedTime: '20-30 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      'audience building': {
        id: Date.now().toString(),
        title: 'Engage with 20 posts in your niche',
        description: 'Find 20 posts from people in your industry or your ideal customers. Leave thoughtful comments that add value.',
        reason: 'Building an audience starts with genuine engagement. This grows your visibility organically.',
        estimatedTime: '25-35 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      'brand expansion': {
        id: Date.now().toString(),
        title: 'Reach out to 3 potential collaboration partners',
        description: 'Identify 3 complementary businesses or creators. Send them a message proposing a mutual benefit (guest post, co-promo, referral).',
        reason: 'Partnerships accelerate growth by tapping into established audiences.',
        estimatedTime: '20-30 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      sales: {
        id: Date.now().toString(),
        title: 'Follow up with 5 warm leads',
        description: 'Reach out to people who showed interest but haven\'t bought. Ask a genuine question about their situation or offer to help clarify any concerns.',
        reason: 'Most sales happen after multiple touchpoints. Following up closes deals.',
        estimatedTime: '20-30 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      systems: {
        id: Date.now().toString(),
        title: 'Automate or delegate one repetitive task',
        description: 'Identify something you do repeatedly each week. Set up an automation (Zapier, templates) or document it for delegation.',
        reason: 'Every task you automate or delegate gives you more time for high-impact work.',
        estimatedTime: '30-45 minutes',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };
    return directives[focus] || directives.leads;
  }, []);

  return {
    projects,
    activeProject,
    activeProjectId,
    userSettings: userSettingsQuery.data ?? DEFAULT_USER_SETTINGS,
    metrics: projectMetrics,
    assets: projectAssets,
    content: projectContent,
    tasks: projectTasks,
    weeklyMission: projectWeeklyMission,
    monthlyMilestone: projectMonthlyMilestone,
    isOnboardingComplete,
    isLoading: projectsQuery.isLoading,
    
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    archiveProject: archiveProjectMutation.mutate,
    switchProject: switchProjectMutation.mutate,
    
    updateFocusMode: updateFocusModeMutation.mutate,
    updateDailyDirective: updateDailyDirectiveMutation.mutate,
    completeDailyDirective: completeDailyDirectiveMutation.mutate,
    updateAdvisorDirective: updateAdvisorDirectiveMutation.mutate,
    
    updateUserSettings: updateUserSettingsMutation.mutate,
    logout: logoutMutation.mutate,
    
    addMetrics: addMetricsMutation.mutate,
    addAsset: addAssetMutation.mutate,
    updateAsset: updateAssetMutation.mutate,
    deleteAsset: deleteAssetMutation.mutate,
    addContent: addContentMutation.mutate,
    setTasks: setTasksMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
    setWeeklyMission: setWeeklyMissionMutation.mutate,
    setMonthlyMilestone: setMonthlyMilestoneMutation.mutate,
    
    getCurrentFocus,
    generateDailyDirective,
  };
});
