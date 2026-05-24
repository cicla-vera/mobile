import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { AppNotification } from '@/constants/notifications';
import { colors, radius, spacing } from '@/constants/theme';

type NotificationsModalProps = {
  visible: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
};

export function NotificationsModal({
  visible,
  notifications,
  onClose,
  onMarkAllRead,
  onMarkRead,
}: NotificationsModalProps) {
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <AppText variant="heading" style={styles.title}>
                Notificações
              </AppText>
              {unreadCount > 0 ? (
                <AppText variant="caption" tone="muted">
                  {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                </AppText>
              ) : null}
            </View>

            <Pressable onPress={onMarkAllRead} style={styles.markAllButton}>
              <AppText style={styles.markAllLabel}>Marcar todas</AppText>
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((notification) => (
              <Pressable
                key={notification.id}
                onPress={() => onMarkRead(notification.id)}
                style={[
                  styles.item,
                  !notification.read && styles.itemUnread,
                ]}
              >
                <View style={styles.itemHeader}>
                  <AppText style={styles.itemTitle}>{notification.title}</AppText>
                  {!notification.read ? <View style={styles.unreadDot} /> : null}
                </View>
                <AppText style={styles.itemMessage}>{notification.message}</AppText>
                <AppText variant="caption" tone="soft" style={styles.itemTime}>
                  {notification.time}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <AppText style={styles.closeLabel}>Fechar</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 16, 17, 0.45)',
  },
  sheet: {
    maxHeight: '72%',
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing[5],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  markAllButton: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  markAllLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.blue,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: spacing[3],
    paddingBottom: spacing[4],
  },
  item: {
    padding: spacing[4],
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  itemUnread: {
    borderWidth: 1,
    borderColor: 'rgba(32, 37, 123, 0.12)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  itemTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
    marginLeft: spacing[2],
  },
  itemMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  itemTime: {
    marginTop: spacing[2],
  },
  closeButton: {
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.cream,
  },
});
