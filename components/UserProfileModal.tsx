import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { DEMO_ACCOUNTS, useAuth } from '../context/AuthContext';
import { StorageAuditItem } from '../types';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { user, logout, quickLogin, refreshSecurityAudit } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'storage'>('profile');
  const [auditItems, setAuditItems] = useState<StorageAuditItem[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const loadAudit = useCallback(async () => {
    setIsLoadingAudit(true);
    try {
      const items = await refreshSecurityAudit();
      setAuditItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAudit(false);
    }
  }, [refreshSecurityAudit]);

  useEffect(() => {
    if (visible) {
      loadAudit();
    }
  }, [visible, loadAudit]);

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSwitchAccount = async (email: string) => {
    await quickLogin(email);
    loadAudit();
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatarBadge, { backgroundColor: user.avatarColor || COLORS.primary }]}>
                <Text style={styles.avatarText}>{user.name[0]}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={styles.roleTag}>
                  <Ionicons
                    name={user.role === 'Ketua Kos' ? 'shield-checkmark' : 'person'}
                    size={12}
                    color={COLORS.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.roleTagText}>{user.role}</Text>
                </View>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab('profile')}
              style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={activeTab === 'profile' ? COLORS.primary : COLORS.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
                Profil Saya
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('storage')}
              style={[styles.tabBtn, activeTab === 'storage' && styles.tabBtnActive]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={activeTab === 'storage' ? COLORS.primary : COLORS.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'storage' && styles.tabTextActive]}>
                Audit Penyimpanan
              </Text>
              <View style={styles.auditPill}>
                <Text style={styles.auditPillText}>Live</Text>
              </View>
            </Pressable>
          </View>

          {/* Scrollable Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {activeTab === 'profile' ? (
              <View>
                {/* Info Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>📋 Detail Keanggotaan</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email Terdaftar</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nama Kos</Text>
                    <Text style={styles.infoValue}>{user.kosName}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nomor Kamar</Text>
                    <Text style={styles.infoValue}>{user.roomNumber}</Text>
                  </View>

                  {user.phone ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>No. Handphone</Text>
                      <Text style={styles.infoValue}>{user.phone}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Quick Switch Demo Account */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>⚡ Ganti Akun Penguji (1-Klik)</Text>
                  <Text style={styles.sectionCardSub}>
                    Beralih akun untuk menguji fitur dengan peran berbeda:
                  </Text>

                  {DEMO_ACCOUNTS.map((acc) => {
                    const isCurrent = acc.user.email.toLowerCase() === user.email.toLowerCase();
                    return (
                      <Pressable
                        key={acc.user.id}
                        onPress={() => !isCurrent && handleSwitchAccount(acc.user.email)}
                        style={({ pressed }) => [
                          styles.switchItem,
                          isCurrent && styles.switchItemActive,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <View style={[styles.switchAvatar, { backgroundColor: acc.user.avatarColor }]}>
                          <Text style={styles.switchAvatarText}>{acc.user.name[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.switchName}>
                            {acc.user.name} {isCurrent && ' (Aktif)'}
                          </Text>
                          <Text style={styles.switchRole}>
                            {acc.user.role} • {acc.user.roomNumber}
                          </Text>
                        </View>
                        {isCurrent ? (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
                        ) : (
                          <Text style={styles.switchAction}>Pilih</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Logout Button */}
                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [styles.logoutBtn, pressed && styles.btnPressed]}
                >
                  <Ionicons name="log-out-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
                  <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                {/* Live Storage Audit View */}
                <View style={styles.auditHero}>
                  <Text style={styles.auditHeroTitle}>Inspeksi Local & Secure Storage</Text>
                  <Text style={styles.auditHeroSub}>
                    Bukti transparansi pemisahan data aman (SecureStore) dan data preferensi/state (AsyncStorage).
                  </Text>
                  <Pressable
                    onPress={loadAudit}
                    disabled={isLoadingAudit}
                    style={({ pressed }) => [styles.refreshBtn, pressed && styles.btnPressed]}
                  >
                    <Ionicons
                      name="refresh"
                      size={14}
                      color={COLORS.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.refreshBtnText}>
                      {isLoadingAudit ? 'Memuat...' : 'Segarkan Data'}
                    </Text>
                  </Pressable>
                </View>

                {isLoadingAudit ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <View>
                    {/* Secure Store Items */}
                    <Text style={styles.storageCategoryTitle}>
                      🔐 Expo SecureStore (Hardware Encrypted)
                    </Text>
                    {auditItems
                      .filter((item) => item.storageType === 'Expo SecureStore')
                      .map((item) => (
                        <View key={item.key} style={styles.auditCard}>
                          <View style={styles.auditCardHeader}>
                            <View style={styles.keyBadgeSecure}>
                              <Ionicons name="lock-closed" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                              <Text style={styles.keyBadgeSecureText}>{item.key}</Text>
                            </View>
                            <Text style={styles.statusActive}>
                              {item.exists ? '✓ Tersimpan' : 'Kosong'}
                            </Text>
                          </View>
                          <Text style={styles.auditDesc}>{item.description}</Text>
                          <View style={styles.previewBox}>
                            <Text style={styles.previewLabel}>Nilai saat ini:</Text>
                            <Text style={styles.previewValue}>{item.preview}</Text>
                          </View>
                        </View>
                      ))}

                    {/* Local Storage Items */}
                    <Text style={[styles.storageCategoryTitle, { marginTop: SPACING.md }]}>
                      💾 AsyncStorage (Local Storage)
                    </Text>
                    {auditItems
                      .filter((item) => item.storageType === 'AsyncStorage')
                      .map((item) => (
                        <View key={item.key} style={styles.auditCard}>
                          <View style={styles.auditCardHeader}>
                            <View style={styles.keyBadgeLocal}>
                              <Ionicons name="file-tray" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                              <Text style={styles.keyBadgeLocalText}>{item.key}</Text>
                            </View>
                            <Text style={styles.statusActive}>
                              {item.exists ? '✓ Tersimpan' : 'Kosong'}
                            </Text>
                          </View>
                          <Text style={styles.auditDesc}>{item.description}</Text>
                          <View style={styles.previewBox}>
                            <Text style={styles.previewLabel}>Nilai saat ini:</Text>
                            <Text style={styles.previewValue}>{item.preview}</Text>
                          </View>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.small,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  auditPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
    marginLeft: 6,
  },
  auditPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  body: {
    marginVertical: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  switchItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  switchAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  switchAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  switchName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  switchRole: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  switchAction: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  btnPressed: {
    opacity: 0.75,
  },
  auditHero: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  auditHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  auditHeroSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 16,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  storageCategoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  auditCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  auditCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  keyBadgeSecure: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  keyBadgeSecureText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  keyBadgeLocal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  keyBadgeLocalText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusActive: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  auditDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  previewBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  previewLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 1,
  },
});
