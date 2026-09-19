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
    String? siteId,
  }) async {
    final json = await _api.postJson(
      '/rondas',
      {
        'templateId': templateId,
        'location': location,
        if (siteId != null) 'siteId': siteId,
      },
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

  Future<Ronda> addFinding({
    required String id,
    required String title,
    required String notes,
    required String severity,
    int? itemIndex,
  }) async {
    final json = await _api.postJson(
      '/rondas/$id/findings',
      {
        'title': title,
        'notes': notes,
        'severity': severity,
        if (itemIndex != null) 'itemIndex': itemIndex,
      },
      auth: true,
    );
    return Ronda.fromJson(json);
  }

  Future<Ronda> resolveFinding(String id, String findingId) async {
    final json = await _api.postJson(
      '/rondas/$id/findings/$findingId/resolve',
      {},
      auth: true,
    );
    return Ronda.fromJson(json);
  }

  Future<Ronda> updateFinding({
    required String id,
    required String findingId,
    String? status,
    String? assignee,
    String? resolutionNote,
  }) async {
    final json = await _api.patchJson(
      '/rondas/$id/findings/$findingId',
      {
        if (status != null) 'status': status,
        if (assignee != null) 'assignee': assignee,
        if (resolutionNote != null) 'resolutionNote': resolutionNote,
      },
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

  Future<List<int>> exportPdf(String id) {
    return _api.getBytes('/rondas/$id/export.pdf', auth: true);
  }
}
