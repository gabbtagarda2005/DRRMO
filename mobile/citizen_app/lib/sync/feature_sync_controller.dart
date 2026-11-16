import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/foundation.dart';

/// Syncs the citizen app feature manifest from the API (or cache).
/// Runs on app start (including browser refresh) and when the user taps Refresh.
class FeatureSyncController extends ChangeNotifier {
  FeatureSyncController({AppSyncRepository? repository})
      : _repository = repository ?? AppSyncRepository();

  final AppSyncRepository _repository;

  FeatureManifest _manifest = FeatureManifest.defaults();
  bool isSyncing = false;
  DateTime? lastSyncedAt;
  int newFeaturesCount = 0;
  String? lastSyncMessage;

  FeatureManifest get manifest => _manifest;
  int get manifestVersion => _manifest.version;

  static const _alwaysEnabled = {'logout', 'tab_home'};

  bool isEnabled(String featureId) =>
      _alwaysEnabled.contains(featureId) || _manifest.enabledIds.contains(featureId);

  /// Full sync: feature manifest + session refresh when [refreshSession] is provided.
  Future<void> sync({Future<void> Function()? refreshSession}) async {
    isSyncing = true;
    lastSyncMessage = null;
    notifyListeners();

    try {
      final previousKnown = await _repository.loadKnownFeatureIds();
      final previousEnabled = _manifest.enabledIds;

      await refreshSession?.call();

      final fetched = await _repository.fetchCitizenFeatures();
      _manifest = fetched;
      lastSyncedAt = DateTime.now();

      final enabled = fetched.enabledIds;
      final newlyEnabled = enabled.difference(previousKnown.isEmpty ? previousEnabled : previousKnown);
      newFeaturesCount = newlyEnabled.length;
      await _repository.saveKnownFeatureIds(enabled);

      if (newFeaturesCount > 0) {
        lastSyncMessage =
            'Synced $newFeaturesCount new feature${newFeaturesCount == 1 ? '' : 's'}.';
      } else {
        lastSyncMessage = 'App is up to date (v${fetched.version}).';
      }
    } catch (_) {
      _manifest = await _repository.restoreCachedManifest();
      lastSyncedAt = DateTime.now();
      lastSyncMessage = 'Using cached features — could not reach the server.';
    } finally {
      isSyncing = false;
      notifyListeners();
    }
  }

  Future<void> bootstrap({Future<void> Function()? refreshSession}) async {
    _manifest = await _repository.restoreCachedManifest();
    notifyListeners();
    await sync(refreshSession: refreshSession);
  }

  void clearSyncMessage() {
    lastSyncMessage = null;
    notifyListeners();
  }
}
