import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {
  Plus,
  FileText,
  Phone,
  MessageSquare,
  Mail,
  Target,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  X,
  Briefcase,
  Star,
  Trophy,
  BarChart3,
  Link2,
} from 'lucide-react-native';
import { useBusiness } from '@/store/BusinessContext';
import { RevenueAsset } from '@/types/business';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const ASSET_TYPES = [
  { key: 'offer', label: 'Offer', icon: Target },
  { key: 'script', label: 'Sales Script', icon: Phone },
  { key: 'dm', label: 'DM Script', icon: MessageSquare },
  { key: 'followup', label: 'Follow-up', icon: Mail },
  { key: 'funnel', label: 'Funnel', icon: FileText },
] as const;

function TopPerformingSection({ assets }: { assets: RevenueAsset[] }) {
  const ranked = React.useMemo(() => {
    const withUsage = assets.filter(a => (a.usageCount || 0) > 0);
    return withUsage
      .map(a => {
        const usage = a.usageCount || 0;
        const results = a.resultCount || 0;
        const rating = a.rating || 0;
        const ratio = usage > 0 ? results / usage : 0;
        const score = (ratio * 0.6 + (rating / 5) * 0.4) * 100;
        return { ...a, ratio, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [assets]);

  if (ranked.length === 0) return null;

  return (
    <View style={topStyles.container}>
      <View style={topStyles.header}>
        <Trophy size={16} color="#F59E0B" />
        <Text style={topStyles.headerText}>Top Performing Assets</Text>
      </View>
      {ranked.map((item, idx) => (
        <View key={item.id} style={topStyles.row}>
          <View style={[topStyles.rank, { backgroundColor: idx === 0 ? '#F59E0B20' : Colors.tertiary }]}>
            <Text style={[topStyles.rankText, idx === 0 && { color: '#F59E0B' }]}>{idx + 1}</Text>
          </View>
          <View style={topStyles.info}>
            <Text style={topStyles.title} numberOfLines={1}>{item.title}</Text>
            <View style={topStyles.stats}>
              <Text style={topStyles.stat}>{item.usageCount || 0} uses</Text>
              <Text style={topStyles.statDot}>{"\u00B7"}</Text>
              <Text style={topStyles.stat}>{item.resultCount || 0} results</Text>
              <Text style={topStyles.statDot}>{"\u00B7"}</Text>
              <View style={topStyles.ratingRow}>
                <Star size={10} color="#F59E0B" fill="#F59E0B" />
                <Text style={topStyles.stat}>{(item.rating || 0).toFixed(1)}</Text>
              </View>
            </View>
          </View>
          <Text style={topStyles.score}>{Math.round(item.score)}</Text>
        </View>
      ))}
    </View>
  );
}

const topStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stat: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statDot: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  score: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
});

export default function AssetsScreen() {
  const { assets, addAsset, updateAsset, deleteAsset, rateAsset, incrementAssetResult, activeProject, activeProjectId } = useBusiness();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<RevenueAsset | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<RevenueAsset['type']>('offer');

  const filteredAssets = selectedType
    ? assets.filter((a) => a.type === selectedType)
    : assets;

  const getTypeIcon = (type: string) => {
    const typeConfig = ASSET_TYPES.find((t) => t.key === type);
    const IconComponent = typeConfig?.icon || FileText;
    return <IconComponent size={18} color={Colors.accent} />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={14} color={Colors.success} />;
      case 'tested':
        return <Target size={14} color={Colors.warning} />;
      default:
        return <Clock size={14} color={Colors.textMuted} />;
    }
  };

  const handleRateAsset = (assetId: string, rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rateAsset({ id: assetId, rating });
  };

  const handleIncrementResult = (assetId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementAssetResult(assetId);
  };

  const handleAddAsset = () => {
    setEditingAsset(null);
    setNewTitle('');
    setNewContent('');
    setNewType('offer');
    setIsModalVisible(true);
  };

  const handleEditAsset = (asset: RevenueAsset) => {
    setEditingAsset(asset);
    setNewTitle(asset.title);
    setNewContent(asset.content);
    setNewType(asset.type);
    setIsModalVisible(true);
  };

  const handleSaveAsset = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!activeProjectId) {
      Alert.alert('Error', 'No project selected');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (editingAsset) {
      updateAsset({
        id: editingAsset.id,
        updates: { title: newTitle, content: newContent, type: newType },
      });
    } else {
      const newAsset: RevenueAsset = {
        id: Date.now().toString(),
        projectId: activeProjectId,
        type: newType,
        title: newTitle,
        content: newContent,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        resultCount: 0,
        rating: 0,
      };
      addAsset(newAsset);
    }

    setIsModalVisible(false);
  };

  const handleDeleteAsset = (id: string) => {
    Alert.alert('Delete Asset', 'Are you sure you want to delete this asset?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteAsset(id);
        },
      },
    ]);
  };

  const handleStatusChange = (asset: RevenueAsset) => {
    const statusOrder: RevenueAsset['status'][] = ['draft', 'active', 'tested'];
    const currentIndex = statusOrder.indexOf(asset.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateAsset({ id: asset.id, updates: { status: nextStatus } });
  };

  if (!activeProject) {
    return (
      <View style={styles.emptyContainer}>
        <Briefcase size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Project Selected</Text>
        <Text style={styles.emptyText}>
          Select or create a project to manage your revenue assets
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, !selectedType && styles.filterChipActive]}
          onPress={() => setSelectedType(null)}
        >
          <Text style={[styles.filterText, !selectedType && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {ASSET_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[styles.filterChip, selectedType === type.key && styles.filterChipActive]}
            onPress={() => setSelectedType(type.key)}
          >
            <Text
              style={[styles.filterText, selectedType === type.key && styles.filterTextActive]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.assetsList} contentContainerStyle={styles.assetsContent}>
        <TopPerformingSection assets={assets} />
        {filteredAssets.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No assets yet</Text>
            <Text style={styles.emptyStateText}>
              Create offers, scripts, and funnels to grow your revenue
            </Text>
          </View>
        ) : (
          filteredAssets.map((asset) => (
            <View key={asset.id} style={styles.assetCard}>
              <View style={styles.assetHeader}>
                <View style={styles.assetTypeIcon}>{getTypeIcon(asset.type)}</View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetTitle}>{asset.title}</Text>
                  <Text style={styles.assetType}>
                    {ASSET_TYPES.find((t) => t.key === asset.type)?.label}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => handleStatusChange(asset)}
                >
                  {getStatusIcon(asset.status)}
                  <Text style={styles.statusText}>{asset.status}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.assetContent} numberOfLines={3}>
                {asset.content}
              </Text>
              <View style={styles.assetMetrics}>
                <View style={styles.assetMetricItem}>
                  <Link2 size={12} color={Colors.textMuted} />
                  <Text style={styles.assetMetricText}>{asset.usageCount || 0} uses</Text>
                </View>
                <View style={styles.assetMetricItem}>
                  <BarChart3 size={12} color={Colors.textMuted} />
                  <Text style={styles.assetMetricText}>{asset.resultCount || 0} results</Text>
                </View>
                <View style={styles.assetRating}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => handleRateAsset(asset.id, star)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                      <Star
                        size={14}
                        color="#F59E0B"
                        fill={(asset.rating || 0) >= star ? '#F59E0B' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.assetActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleIncrementResult(asset.id)}
                >
                  <Target size={16} color={Colors.accent} />
                  <Text style={[styles.actionText, { color: Colors.accent }]}>+Result</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditAsset(asset)}
                >
                  <Edit3 size={16} color={Colors.textSecondary} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteAsset(asset.id)}
                >
                  <Trash2 size={16} color={Colors.error} />
                  <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddAsset}>
        <Plus size={24} color={Colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAsset ? 'Edit Asset' : 'New Asset'}
            </Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeSelector}
            >
              {ASSET_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeOption,
                    newType === type.key && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewType(type.key as RevenueAsset['type'])}
                >
                  <type.icon
                    size={18}
                    color={newType === type.key ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      newType === type.key && styles.typeOptionTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter asset title..."
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={[styles.textInput, styles.contentInput]}
              value={newContent}
              onChangeText={setNewContent}
              placeholder="Enter your script, offer, or content..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAsset}>
              <Text style={styles.saveButtonText}>Save Asset</Text>
            </TouchableOpacity>
          </View>
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
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.primary,
  },
  assetsList: {
    flex: 1,
  },
  assetsContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  assetCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  assetType: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.tertiary,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  assetContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  assetMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.tertiary,
    borderRadius: 8,
  },
  assetMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assetMetricText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  assetRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  assetActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    marginRight: 8,
  },
  typeOptionActive: {
    backgroundColor: Colors.accent,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  typeOptionTextActive: {
    color: Colors.primary,
  },
  textInput: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentInput: {
    height: 200,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
