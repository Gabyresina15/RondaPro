import '../../../core/network/api_client.dart';
import '../domain/dashboard_stats.dart';

class DashboardRepository {
  DashboardRepository(this._api);

  final ApiClient _api;

  Future<DashboardStats> load() async {
    final json = await _api.getJson('/dashboard', auth: true);
    return DashboardStats.fromJson(json);
  }
}
