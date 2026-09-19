class DashboardStats {
  const DashboardStats({
    required this.sitesCount,
    required this.templatesCount,
    required this.rondasInProgress,
    required this.rondasCompleted,
    required this.photosTotal,
    required this.findingsOpen,
    required this.findingsHigh,
    this.lastCompletedAt,
  });

  final int sitesCount;
  final int templatesCount;
  final int rondasInProgress;
  final int rondasCompleted;
  final int photosTotal;
  final int findingsOpen;
  final int findingsHigh;
  final DateTime? lastCompletedAt;

  static int _toInt(dynamic value) {
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }
    return int.tryParse('$value') ?? 0;
  }

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final last = json['lastCompletedAt'];
    return DashboardStats(
      sitesCount: _toInt(json['sitesCount']),
      templatesCount: _toInt(json['templatesCount']),
      rondasInProgress: _toInt(json['rondasInProgress']),
      rondasCompleted: _toInt(json['rondasCompleted']),
      photosTotal: _toInt(json['photosTotal']),
      findingsOpen: _toInt(json['findingsOpen']),
      findingsHigh: _toInt(json['findingsHigh']),
      lastCompletedAt: last is String && last.isNotEmpty
          ? DateTime.tryParse(last)
          : null,
    );
  }
}
