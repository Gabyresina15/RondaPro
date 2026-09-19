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

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      sitesCount: json['sitesCount'] as int? ?? 0,
      templatesCount: json['templatesCount'] as int? ?? 0,
      rondasInProgress: json['rondasInProgress'] as int? ?? 0,
      rondasCompleted: json['rondasCompleted'] as int? ?? 0,
      photosTotal: json['photosTotal'] as int? ?? 0,
      findingsOpen: json['findingsOpen'] as int? ?? 0,
      findingsHigh: json['findingsHigh'] as int? ?? 0,
      lastCompletedAt: json['lastCompletedAt'] == null
          ? null
          : DateTime.parse(json['lastCompletedAt'] as String),
    );
  }
}
