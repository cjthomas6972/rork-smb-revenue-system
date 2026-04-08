import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Archive, Copy, Edit3, Plus, Star, Trash2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBusiness } from '@/store/BusinessContext';
import { RevenueAsset } from '@/types/business';

const FILTERS: Array<{ key: 'all' | RevenueAsset['type']; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'offer', label: 'Offers' },
  { key: 'script', label: 'Scripts' },
  { key: 'funnel', label: 'Funnels' },
  { key: 'dm', label: 'DMs' },
  { key: 'followup', label: 'Followups' },
];

const SORTS = [
  { key: 'recent', label: 'Recently used' },
  { key: 'rating', label: 'Highest rated' },
  { key: 'results', label: 'Most results' },
] as const;

type SortKey = (typeof SORTS)[number]['key'];

const TYPE_COLORS: Record<RevenueAsset['type'], string> = {
  offer: '#2563EB',
  script: '#7C3AED',
  funnel: '#F97316',
  dm: '#00D4AA',
  followup: '#EF4444',
};

export default function AssetsScreen() {
  const {
    activeProjectId,
    activeProject,
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    rateAsset,
  } = useBusiness();

  const [filter, setFilter] = useState<'all' | RevenueAsset['type']>('all');
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [selectedAsset, setSelectedAsset] = useState<RevenueAsset | null>(null);
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftContent, setDraftContent] = useState<string>('');
  const [draftType, setDraftType] = useState<RevenueAsset['type']>('offer');

  const filteredAssets = useMemo(() => {
    const base = filter === 'all' ? assets : assets.filter((asset) => asset.type === filter);
    const sorted = [...base];

    if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'results') {
      sorted.sort((a, b) => (b.resultCount ?? 0) - (a.resultCount ?? 0));
    } else {
      sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return sorted;
  }, [assets, filter, sortBy]);

  const openNewAsset = () => {
    setSelectedAsset(null);
    setDraftTitle('');
    setDraftContent('');
    setDraftType('offer');
    setEditorVisible(true);
  };

  const openEditAsset = (asset: RevenueAsset) => {
    setSelectedAsset(asset);
    setDraftTitle(asset.title);
    setDraftContent(asset.content);
    setDraftType(asset.type);
    setEditorVisible(true);
  };

  const saveAsset = () => {
    if (!activeProjectId) return;
    if (!draftTitle.trim() || !draftContent.trim()) {
      Alert.alert('Missing info', 'Add a title and content first.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (selectedAsset) {
      updateAsset({
        id: selectedAsset.id,
        updates: {
          title: draftTitle.trim(),
          content: draftContent.trim(),
          type: draftType,
        },
      });
    } else {
      const now = new Date().toISOString();
      addAsset({
        id: `${Date.now()}`,
        projectId: activeProjectId,
        type: draftType,
        title: draftTitle.trim(),
        content: draftContent.trim(),
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
        resultCount: 0,
        rating: 0,
      });
    }

    setEditorVisible(false);
  };

  const archiveAsset = (asset: RevenueAsset) => {
    updateAsset({ id: asset.id, updates: { status: 'draft' } });
    setSelectedAsset(null);
  };

  const removeAsset = (assetId: string) => {
    Alert.alert('Delete asset', 'Remove this asset from the arsenal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAsset(assetId),
      },
    ]);
  };

  if (!activeProject) {
    return (
      <View style={styles.emptyContainer}>
        <Archive size={42} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No active arsenal</Text>
        <Text style={styles.emptyText}>Select a project to access saved offers, scripts, and followups.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((item) => {
            const selected = filter === item.key;
            return (
              <TouchableOpacity key={item.key} style={[styles.filterChip, selected && styles.filterChipActive]} onPress={() => setFilter(item.key)}>
                <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORTS.map((item) => {
            const selected = sortBy === item.key;
            return (
              <TouchableOpacity key={item.key} style={[styles.sortChip, selected && styles.sortChipActive]} onPress={() => setSortBy(item.key)}>
                <Text style={[styles.sortChipText, selected && styles.sortChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredAssets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const typeColor = TYPE_COLORS[item.type];
          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={() => setSelectedAsset(item)}>
              <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18`, borderColor: `${typeColor}44` }]}>
                  <Text style={[styles.typeBadgeText, { color: typeColor }]}>{item.type.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'active' && styles.statusBadgeActive, item.status === 'tested' && styles.statusBadgeTested]}>
                  <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardPreview} numberOfLines={2}>{item.content}</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>{item.usageCount} uses</Text>
                <Text style={styles.statsDot}>·</Text>
                <Text style={styles.statsText}>{item.resultCount} results</Text>
                <Text style={styles.statsDot}>·</Text>
                <Text style={styles.statsText}>★ {item.rating}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Archive size={40} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>Your arsenal is empty.</Text>
            <Text style={styles.emptyStateText}>Go to FORGE and ask SKYFORGE to write your first offer script.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openNewAsset} testID="arsenal-add-asset-button">
        <Plus size={22} color={Colors.text} />
      </TouchableOpacity>

      <Modal visible={selectedAsset !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedAsset(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedAsset?.title ?? 'Asset'}</Text>
            <TouchableOpacity onPress={() => setSelectedAsset(null)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.viewerType}>{selectedAsset?.type.toUpperCase()} · {selectedAsset?.status.toUpperCase()}</Text>
            <Text style={styles.viewerContent}>{selectedAsset?.content}</Text>
            <View style={styles.viewerRatingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => selectedAsset && rateAsset({ id: selectedAsset.id, rating: star })}>
                  <Star size={20} color="#F59E0B" fill={(selectedAsset?.rating ?? 0) >= star ? '#F59E0B' : 'transparent'} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.viewerActions}>
            <TouchableOpacity style={styles.viewerAction} onPress={() => selectedAsset && openEditAsset(selectedAsset)}>
              <Edit3 size={16} color={Colors.accent} />
              <Text style={styles.viewerActionText}>EDIT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewerAction} onPress={() => selectedAsset && archiveAsset(selectedAsset)}>
              <Copy size={16} color={Colors.accent} />
              <Text style={styles.viewerActionText}>ARCHIVE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewerActionDanger} onPress={() => selectedAsset && removeAsset(selectedAsset.id)}>
              <Trash2 size={16} color={Colors.error} />
              <Text style={styles.viewerActionDangerText}>DELETE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={editorVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedAsset ? 'Edit asset' : 'New asset'}</Text>
            <TouchableOpacity onPress={() => setEditorVisible(false)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editorTypeRow}>
              {FILTERS.filter((item) => item.key !== 'all').map((item) => {
                const selected = draftType === item.key;
                return (
                  <TouchableOpacity key={item.key} style={[styles.editorTypeChip, selected && styles.editorTypeChipActive]} onPress={() => setDraftType(item.key as RevenueAsset['type'])}>
                    <Text style={[styles.editorTypeChipText, selected && styles.editorTypeChipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput style={styles.input} value={draftTitle} onChangeText={setDraftTitle} placeholder="Asset title" placeholderTextColor={Colors.textMuted} />
            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={styles.contentInput}
              value={draftContent}
              onChangeText={setDraftContent}
              placeholder="Write the script, offer, or follow-up here..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
          <TouchableOpacity style={styles.saveButton} onPress={saveAsset}>
            <Text style={styles.saveButtonText}>SAVE ASSET</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  topBar: {
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  sortRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  sortChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  sortChipActive: {
    borderColor: Colors.accent,
  },
  sortChipText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  sortChipTextActive: {
    color: Colors.accent,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#00D4AA22',
  },
  statusBadgeTested: {
    backgroundColor: '#F9731622',
  },
  statusBadgeText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  cardPreview: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  statsDot: {
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 14,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 14,
    marginBottom: 8,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalBody: {
    flex: 1,
  },
  viewerType: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  viewerContent: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  viewerRatingRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  viewerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  viewerAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewerActionText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  viewerActionDanger: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewerActionDangerText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 14,
  },
  editorTypeRow: {
    gap: 8,
    paddingBottom: 4,
  },
  editorTypeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  editorTypeChipActive: {
    borderColor: Colors.accent,
  },
  editorTypeChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  editorTypeChipTextActive: {
    color: Colors.accent,
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 14,
    color: Colors.text,
    fontSize: 14,
  },
  contentInput: {
    minHeight: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.secondary,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
});
