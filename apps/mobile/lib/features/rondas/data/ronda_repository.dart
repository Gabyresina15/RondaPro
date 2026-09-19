import '../../../core/network/api_client.dart';
import '../domain/ronda.dart';

class RondaRepository {
  RondaRepository(this._api);

  final ApiClient _api;

  Future<List<Ronda>> list() async {
    final json = await _api.getJson('/rondas', auth: true);
    final items = json['items'] as List<dynamic>? ?? const [];
    return items
        .map((e) => Ronda.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Ronda> start({
    required String templateId,
    required String location,
  }) async {
    final json = await _api.postJson(
      '/rondas',
      {'templateId': templateId, 'location': location},
      auth: true,
    );
    return Ronda.fromJson(json);
  }

  Future<Ronda> getById(String id) async {
    final json = await _api.getJson('/rondas/$id', auth: true);
    return Ronda.fromJson(json);
  }

  Future<Ronda> saveAnswers(String id, List<RondaAnswer> answers) async {
    final json = await _api.patchJson(
      '/rondas/$id/answers',
      {'answers': answers.map((a) => a.toJson()).toList()},
      auth: true,
    );
    return Ronda.fromJson(json);
  }

  Future<Ronda> addPhotos({
    required String id,
    required List<Map<String, dynamic>> photos,
  }) async {
    final json = await _api.postJson(
      '/rondas/$id/photos',
      {'photos': photos},
      auth: true,
    );
    return Ronda.fromJson(json);
  }

  Future<Ronda> complete(String id) async {
    final json = await _api.postJson('/rondas/$id/complete', {}, auth: true);
    return Ronda.fromJson(json);
  }

  Future<List<int>> photoBytes(String rondaId, String photoId) {
    return _api.getBytes('/rondas/$rondaId/photos/$photoId', auth: true);
  }
}
