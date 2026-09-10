import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ticket, TicketStatus } from '../types/ticket';
import { useApp } from '../context/AppContext';
import { TicketClosureModal } from '../components/modals/TicketClosureModal';
import {
  getPriorityColor,
  formatRelativeTime,
} from '../utils/formatters';

interface TicketsScreenProps {
  onNavigateToARScan: (nodeId?: number) => void;
}

export const TicketsScreen: React.FC<TicketsScreenProps> = ({ onNavigateToARScan }) => {
  const { assignedTickets, refreshTickets, selectSimulatedNode } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [closureModalTicket, setClosureModalTicket] = useState<Ticket | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTickets();
    setRefreshing(false);
  };

  const filteredTickets = useMemo(() => {
    if (selectedFilter === 'ALL') return assignedTickets;
    return assignedTickets.filter((t) => t.status === selectedFilter);
  }, [assignedTickets, selectedFilter]);

  const handleScanNode = (ticket: Ticket) => {
    const formattedNodeId = `NODE-${String(ticket.node_id).padStart(2, '0')}`;
    selectSimulatedNode(formattedNodeId);
    onNavigateToARScan(ticket.node_id);
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => {
    const priorityColor = getPriorityColor(item.priority);
    const canRequestClosure = item.status === 'IN_PROGRESS' || item.status === 'OPEN';

    return (
      <View style={[styles.ticketCard, { borderLeftColor: priorityColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
            <Text style={styles.nodeBadge}>Node #{item.node_id}</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.ticketTitle}>{item.title}</Text>
        <Text style={styles.ticketDescription} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.cardMeta}>
          <Text style={styles.timeText}>🕒 {formatRelativeTime(item.created_at)}</Text>
          {item.assigned_to_name && (
            <Text style={styles.techText}>👤 {item.assigned_to_name}</Text>
          )}
        </View>

        {/* Nút hành động trên Ticket */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => handleScanNode(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.scanBtnText}>Quét AR Máy Chủ Này 📷</Text>
          </TouchableOpacity>

          {canRequestClosure && (
            <TouchableOpacity
              style={styles.closureBtn}
              onPress={() => setClosureModalTicket(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.closureBtnText}>Nghiệm thu (BR-04) ✅</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Thanh bộ lọc theo trạng thái */}
      <View style={styles.filterTabs}>
        {[
          { key: 'ALL', label: 'TẤT CẢ' },
          { key: 'OPEN', label: 'CHỜ XỬ LÝ' },
          { key: 'IN_PROGRESS', label: 'ĐANG XỬ LÝ' },
          { key: 'PENDING_CLOSURE', label: 'CHỜ DUYỆT' },
        ].map((tab) => {
          const isActive = selectedFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setSelectedFilter(tab.key as any)}
            >
              <Text
                style={[styles.filterTabText, isActive && styles.filterTabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTicketItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Không có phiếu công việc nào</Text>
            <Text style={styles.emptySub}>
              {selectedFilter === 'ALL'
                ? 'Hiện tại không có Ticket nào được phân công cho bạn.'
                : 'Không có Ticket nào trong trạng thái đã chọn.'}
            </Text>
          </View>
        }
      />

      {closureModalTicket && (
        <TicketClosureModal
          visible={!!closureModalTicket}
          ticketId={closureModalTicket.id}
          ticketTitle={closureModalTicket.title}
          onClose={() => setClosureModalTicket(null)}
          onSuccess={() => {
            setClosureModalTicket(null);
            refreshTickets();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  filterTabActive: {
    backgroundColor: '#0284C7',
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 14,
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  nodeBadge: {
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  ticketTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 6,
  },
  ticketDescription: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8,
    marginBottom: 10,
  },
  timeText: {
    color: '#64748B',
    fontSize: 11,
  },
  techText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scanBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  closureBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  closureBtnText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
