import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { colors, spacing, title, heading, body, caption } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Icon } from '../../src/components/Icon';
import { fetchSchool } from '../../src/services/schools';
import { fetchUniversity } from '../../src/services/universities';
import { fetchCareer } from '../../src/services/careers';
import { fetchCourse } from '../../src/services/courses';
import { School, University, Career, Course } from '../../src/types';
import { supabase } from '../../src/lib';

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const [school, setSchool] = useState<School | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [career, setCareer] = useState<Career | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'saved' | 'unsaved'>('saved');
  const [isSaved, setIsSaved] = useState(false);
  const [slideAnim] = useState(() => new Animated.Value(500));
  const hideTimeoutRef = useRef<number | null>(null);
  const itemTypeRef = useRef<string>('');
  const isMountedRef = useRef(true);

  // Cleanup timeout on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const checkIfSaved = useCallback(async (itemId: string, itemType: string) => {
    if (!supabase) return;
    const authResponse = await supabase.auth.getUser();
    const user = authResponse?.data?.user;
    if (!user) return;

    const { data } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .single();

    if (isMountedRef.current) {
      setIsSaved(!!data);
    }
  }, []);

  const handleSave = async () => {
    if (!supabase) {
      return;
    }
    const authResponse = await supabase.auth.getUser();
    const user = authResponse?.data?.user;
    if (!user) {
      return;
    }

    const itemType = school ? 'school' : university ? 'university' : career ? 'career' : 'course';
    const itemId = id as string;

    if (isSaved) {
      // Remove from favorites
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType);

      if (error) {
        return;
      }

      if (isMountedRef.current) {
        setIsSaved(false);
        setToastType('unsaved');
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
        });

      if (error) {
        return;
      }

      if (isMountedRef.current) {
        setIsSaved(true);
        setToastType('saved');
      }
    }

    // If toast is already showing, instantly animate it down and show new one fast
    if (showToast) {
      // Clear any existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      // Instant slide down (fast timing instead of spring)
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Immediately show new toast with fast animation
        showNewToast(true);
      });
    } else {
      // No toast showing, show with normal smooth animation
      showNewToast(false);
    }
  };

  const showNewToast = (fast = false) => {
    // Clear any existing hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    if (isMountedRef.current) {
      setShowToast(true);
    }
    slideAnim.setValue(500);
    
    if (fast) {
      // Fast animation for spam case - quick with subtle spring
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 30,  // High damping = very subtle spring
        stiffness: 350,
        mass: 1,
        useNativeDriver: true,
      }).start();
    } else {
      // Normal smooth animation with overshoot
      Animated.spring(slideAnim, {
        toValue: -50,
        damping: 20,
        stiffness: 300,
        mass: 1,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 250,
          mass: 1,
          useNativeDriver: true,
        }).start();
      }, 150);
    }

    // Hide after 2 seconds
    hideTimeoutRef.current = setTimeout(() => {
      Animated.spring(slideAnim, {
        toValue: 500,
        damping: 20,
        stiffness: 300,
        mass: 1,
        useNativeDriver: true,
      }).start(() => {
        if (isMountedRef.current) {
          setShowToast(false);
        }
      });
    }, 2000);
  };

  const loadItemData = useCallback(async (itemId: string) => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }

      // Try to fetch as school first
      const schoolResult = await fetchSchool(itemId);
      if (schoolResult.data) {
        if (isMountedRef.current) {
          setSchool(schoolResult.data);
        }
        itemTypeRef.current = 'school';
        // Fetch school profiles
        if (supabase) {
          const { data: profilesData } = await supabase
            .from('school_profiles')
            .select('*')
            .eq('school_id', itemId);
          if (isMountedRef.current) {
            setProfiles(profilesData || []);
          }
        }
        // Check if saved
        checkIfSaved(itemId, 'school');
        return;
      }

      // Try university
      const universityResult = await fetchUniversity(itemId);
      if (universityResult.data) {
        if (isMountedRef.current) {
          setUniversity(universityResult.data);
        }
        itemTypeRef.current = 'university';
        checkIfSaved(itemId, 'university');
        return;
      }

      // Try career
      const careerResult = await fetchCareer(itemId);
      if (careerResult.data) {
        if (isMountedRef.current) {
          setCareer(careerResult.data);
        }
        itemTypeRef.current = 'career';
        checkIfSaved(itemId, 'career');
        return;
      }

      // Try course
      const courseResult = await fetchCourse(itemId);
      if (courseResult.data) {
        if (isMountedRef.current) {
          setCourse(courseResult.data);
        }
        itemTypeRef.current = 'course';
        checkIfSaved(itemId, 'course');
        return;
      }

      if (isMountedRef.current) {
        setLoading(false);
      }
    } catch {
      // Error loading item
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [checkIfSaved]);

  // Refresh saved state when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (id && itemTypeRef.current) {
        checkIfSaved(id as string, itemTypeRef.current);
      }
    }, [id, checkIfSaved])
  );

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadItemData(id as string);
    }
  }, [id, loadItemData]);

  const item = school || university || career || course;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Se încarcă...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Elementul nu a fost găsit</Text>
      </View>
    );
  }

  const title = (item as School | University | Career)?.name || (item as Course)?.title || '';
  const description = (item as School | Career)?.description || 'Descrierea nu este disponibilă.';
  const city = (item as School | University)?.city || '';
  const county = (item as School)?.county || '';
  const website = (item as School | University)?.website || (item as Course)?.url || '';
  const location = city ? `${city}${county ? ', ' + county : ''}` : '';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="ChevronLeft" size={24} color={colors.dark.primary} />
          </Pressable>

          <Text style={styles.title}>{title}</Text>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Descriere</Text>
            <Text style={styles.text}>{description}</Text>
          </Card>

          {location && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Locație</Text>
              <Text style={styles.text}>{location}</Text>
              <Pressable
                style={styles.mapContainer}
                onPress={() => {
                  const searchQuery = encodeURIComponent(`${title} ${location}`);
                  const url = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
                  Linking.openURL(url);
                }}
              >
                <WebView
                  style={styles.mapWebView}
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                          <meta http-equiv="Content-Security-Policy" content="default-src * 'self' blob: data: gap:; style-src * 'self' 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-inline' 'unsafe-eval' blob: data: gap:; frame-src * 'self' blob: data: gap:;">
                          <style>
                            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #1a1a1a; }
                            iframe { width: 100%; height: 100%; border: 0; filter: invert(85%) hue-rotate(180deg) contrast(95%); }
                          </style>
                        </head>
                        <body>
                          <iframe
                            src="https://maps.google.com/maps?q=${encodeURIComponent(title + ' ' + location)}&t=&z=15&ie=UTF8&iwloc=&output=embed&hl=ro"
                            allowfullscreen
                            loading="lazy"
                          ></iframe>
                        </body>
                      </html>
                    `
                  }}
                  scrollEnabled={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={false}
                  startInLoadingState={false}
                  originWhitelist={['https://maps.google.com']}
                  mixedContentMode="compatibility"
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error: ', nativeEvent);
                  }}
                  onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView HTTP error: ', nativeEvent);
                  }}
                />
              </Pressable>
            </Card>
          )}

          {website && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Website</Text>
              <Pressable onPress={() => website && Linking.openURL(website)}>
                <Text style={styles.link}>{website}</Text>
              </Pressable>
            </Card>
          )}

          {profiles.length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Profil și Specializări</Text>
              {profiles.map((profile) => (
                <View key={profile.id} style={styles.profileItem}>
                  <Pressable
                    onPress={() => {
                      setExpandedProfile(expandedProfile === profile.id ? null : profile.id);
                    }}
                  >
                    <View style={styles.profileHeader}>
                      <Text style={styles.profileSpecialization}>{profile.specialization}</Text>
                      <Icon 
                        name={expandedProfile === profile.id ? 'ChevronUp' : 'ChevronDown'} 
                        size={20} 
                        color={colors.dark.primary} 
                      />
                    </View>
                  </Pressable>
                  {expandedProfile === profile.id && (
                    <View style={styles.profileDetails}>
                      <Text style={styles.profileLabel}>Materii principale:</Text>
                      <Text style={styles.profileSubjects}>
                        {profile.key_subjects?.join(', ') || ''}
                      </Text>
                      {profile.admission_notes && (
                        <>
                          <Text style={styles.profileLabel}>Admitere:</Text>
                          <Text style={styles.profileNotes}>{profile.admission_notes}</Text>
                        </>
                      )}
                      <Text style={styles.profileLabel}>Nivel:</Text>
                      <Text style={styles.profileSubjects}>{profile.track}</Text>
                    </View>
                  )}
                </View>
              ))}
            </Card>
          )}

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Sursă</Text>
            <Text style={styles.sourceText}>
              Date verificate la: {new Date(item.verified_at).toLocaleDateString('ro-RO')}
            </Text>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isSaved ? 'Elimină din salvate' : 'Salvează'}
          onPress={handleSave}
          style={styles.button}
        />
      </View>

      {showToast && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { 
              backgroundColor: toastType === 'saved' ? colors.dark.success : colors.dark.danger,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Icon 
            name={toastType === 'saved' ? 'CheckCircle' : 'XCircle'} 
            size={18} 
            color="#fff" 
          />
          <Text style={styles.toastText}>
            {toastType === 'saved' ? 'Salvat cu succes!' : 'Eliminat din salvate!'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  title: {
    ...title,
    color: colors.dark.textPrimary,
    marginBottom: spacing.lg,
    fontSize: 28,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...heading,
    color: colors.dark.textPrimary,
    marginBottom: spacing.sm,
  },
  text: {
    ...body,
    color: colors.dark.textSecondary,
  },
  link: {
    ...caption,
    color: colors.dark.primary,
    marginTop: spacing.sm,
    textDecorationLine: 'underline',
  },
  profileItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSpecialization: {
    ...body,
    color: colors.dark.textPrimary,
    fontWeight: '600',
  },
  profileLabel: {
    ...caption,
    color: colors.dark.textSecondary,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  profileSubjects: {
    ...caption,
    color: colors.dark.textSecondary,
    marginTop: spacing.xs,
  },
  profileNotes: {
    ...caption,
    color: colors.dark.primary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  profileDetails: {
    paddingTop: spacing.sm,
  },
  mapContainer: {
    marginTop: spacing.md,
    height: 200,
    borderRadius: 12,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
    overflow: 'hidden',
    position: 'relative',
  },
  mapWebView: {
    flex: 1,
  },
  sourceText: {
    ...caption,
    color: colors.dark.textSecondary,
  },
  loadingText: {
    ...body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  errorText: {
    ...body,
    color: colors.dark.danger,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  button: {
    marginBottom: 0,
  },
  toastContainer: {
    position: 'absolute',
    bottom: spacing.xl + 75,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toastText: {
    ...body,
    color: '#fff',
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
