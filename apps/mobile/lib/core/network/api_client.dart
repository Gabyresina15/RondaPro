import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiException implements Exception {
  ApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiClient {
  ApiClient({http.Client? httpClient, String? baseUrl})
      : _http = httpClient ?? http.Client(),
        _baseUrl = baseUrl ?? AppConfig.apiBaseUrl;

  final http.Client _http;
  final String _baseUrl;
  String? _token;

  void setToken(String? token) {
    _token = token;
  }

  String? get token => _token;

  Uri _uri(String path) => Uri.parse('$_baseUrl$path');

  Map<String, String> _headers({bool auth = false, bool json = true}) {
    final headers = <String, String>{};
    if (json) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    } else {
      headers['Accept'] = '*/*';
    }
    if (auth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body, {
    bool auth = false,
  }) async {
    final response = await _http.post(
      _uri(path),
      headers: _headers(auth: auth),
      body: jsonEncode(body),
    );
    return _decodeMap(response);
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    bool auth = false,
  }) async {
    final response = await _http.get(
      _uri(path),
      headers: _headers(auth: auth),
    );
    return _decodeMap(response);
  }

  Future<Map<String, dynamic>> patchJson(
    String path,
    Map<String, dynamic> body, {
    bool auth = false,
  }) async {
    final response = await _http.patch(
      _uri(path),
      headers: _headers(auth: auth),
      body: jsonEncode(body),
    );
    return _decodeMap(response);
  }

  Future<List<int>> getBytes(String path, {bool auth = false}) async {
    final response = await _http.get(
      _uri(path),
      headers: _headers(auth: auth, json: false),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.bodyBytes;
    }
    throw ApiException(
      response.statusCode,
      _extractMessage(response.body) ?? 'Request failed',
    );
  }

  Future<void> delete(String path, {bool auth = false}) async {
    final response = await _http.delete(
      _uri(path),
      headers: _headers(auth: auth),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }
    throw ApiException(
      response.statusCode,
      _extractMessage(response.body) ?? 'Request failed',
    );
  }

  Map<String, dynamic> _decodeMap(http.Response response) {
    final dynamic decoded =
        response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      throw ApiException(response.statusCode, 'Unexpected response shape');
    }
    final message = decoded is Map<String, dynamic>
        ? (decoded['message'] as String?) ?? 'Request failed'
        : 'Request failed';
    throw ApiException(response.statusCode, message);
  }

  String? _extractMessage(String body) {
    if (body.isEmpty) {
      return null;
    }
    try {
      final dynamic decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        return decoded['message'] as String?;
      }
    } catch (_) {
      return body;
    }
    return null;
  }
}
