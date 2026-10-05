import { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../hooks/useToast.js';
import BiHeader from './bi/BiHeader.jsx';
import WarehouseOverviewPanel from './bi/WarehouseOverviewPanel.jsx';
import AssociationRulesPanel from './bi/AssociationRulesPanel.jsx';
import CustomerSegmentsPanel from './bi/CustomerSegmentsPanel.jsx';
import OlapExplorerPanel from './bi/OlapExplorerPanel.jsx';
import ChurnPanel from './bi/ChurnPanel.jsx';
import DataGovernancePanel from './bi/DataGovernancePanel.jsx';
import { grainLabels } from './bi/biShared.js';

/**
 * Business Intelligence (BI) Dashboard shell.
 *
 * Owns all data fetching and state for the DWM Sections 1-6 panels and delegates
 * rendering to presentational components in ./bi/.
 */
export default function AdminBIDashboard() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [etlRefreshing, setEtlRefreshing] = useState(false);
  const [timeGrain, setTimeGrain] = useState('month');
  const [overviewData, setOverviewData] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const [associationRules, setAssociationRules] = useState([]);
  const [associationRulesMeta, setAssociationRulesMeta] = useState(null);
  const [minSupport, setMinSupport] = useState(0.01);
  const [minConfidence, setMinConfidence] = useState(0.20);
  const [rulesLimit, setRulesLimit] = useState(10);
  // Section 7: Higher-order itemset size selector (2 = original Apriori, 3 = default, 4 = max)
  const [maxItemsetSize, setMaxItemsetSize] = useState(3);

  const [customerSegments, setCustomerSegments] = useState(null);
  const [customerSegmentsError, setCustomerSegmentsError] = useState(false);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('all');
  const [hoveredCustomerPoint, setHoveredCustomerPoint] = useState(null);

  // Section 4: Interactive Multi-Dimensional OLAP Slice & Dice State
  const [olapLoading, setOlapLoading] = useState(false);
  const [olapData, setOlapData] = useState(null);
  const [olapError, setOlapError] = useState(false);
  const [olapTimeGrain, setOlapTimeGrain] = useState('month');
  const [olapCubeMode, setOlapCubeMode] = useState('cube');
  const [olapMetric, setOlapMetric] = useState('net_revenue');
  const [olapCategoryId, setOlapCategoryId] = useState('all');
  const [olapQuarter, setOlapQuarter] = useState('all');
  const [olapPriceTier, setOlapPriceTier] = useState('all');
  const [olapActivityTier, setOlapActivityTier] = useState('all');
  const [hoveredOlapCell, setHoveredOlapCell] = useState(null);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  // Section 5: Customer Churn Classification & Predictive Forecasting State
  const [churnLoading, setChurnLoading] = useState(false);
  const [churnData, setChurnData] = useState(null);
  const [churnError, setChurnError] = useState(false);
  const [churnRiskFilter, setChurnRiskFilter] = useState('all');
  const [churnSortBy, setChurnSortBy] = useState('churnProbability');
  const [churnSearchQuery, setChurnSearchQuery] = useState('');
  const [selectedChurnCustomer, setSelectedChurnCustomer] = useState(null);
  const [showDecisionTreeModal, setShowDecisionTreeModal] = useState(false);
  const [outreachSentMap, setOutreachSentMap] = useState({});
  const churnRequestIdRef = useRef(0);
  const requestIdRef = useRef(0);

  // Section 6: ETL Pipeline Monitoring, Data Lineage & Quality Auditing State
  const [dataQualityLoading, setDataQualityLoading] = useState(false);
  const [dataQualityData, setDataQualityData] = useState(null);
  const [dataQualityError, setDataQualityError] = useState(false);
  const [dataQualityAuditRunning, setDataQualityAuditRunning] = useState(false);

  const [dataLineageLoading, setDataLineageLoading] = useState(false);
  const [dataLineageData, setDataLineageData] = useState(null);
  const [dataLineageError, setDataLineageError] = useState(false);

  const [qualityActiveTab, setQualityActiveTab] = useState('completeness');
  const [selectedLineageTier, setSelectedLineageTier] = useState('all');
  const [selectedLineageNodeId, setSelectedLineageNodeId] = useState('wh_fact_sales');
  const [showLineageDetailModal, setShowLineageDetailModal] = useState(false);
  const [expandedTableRows, setExpandedTableRows] = useState({ dim_product: true, fact_sales: true });
  const [expandedEtlRuns, setExpandedEtlRuns] = useState({});

  const fetchDataQuality = useCallback(async () => {
    setDataQualityLoading(true);
    setDataQualityError(false);
    try {
      const res = await adminService.getDataQualityReport();
      const report = res?.data || res;
      setDataQualityData(report);
    } catch (err) {
      console.error('Failed to load data quality report:', err);
      setDataQualityError(true);
    } finally {
      setDataQualityLoading(false);
    }
  }, []);

  const fetchDataLineage = useCallback(async () => {
    setDataLineageLoading(true);
    setDataLineageError(false);
    try {
      const res = await adminService.getDataLineage();
      const lineage = res?.data || res;
      setDataLineageData(lineage);
    } catch (err) {
      console.error('Failed to load data lineage:', err);
      setDataLineageError(true);
    } finally {
      setDataLineageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataQuality();
    fetchDataLineage();
  }, [fetchDataQuality, fetchDataLineage]);

  const handleRunQualityAudit = async () => {
    setDataQualityAuditRunning(true);
    try {
      await adminService.runDataQualityAudit();
      showToast('Automated Data Quality Audit executed and logged successfully!', 'success');
      await Promise.all([
        fetchDataQuality(),
        fetchDataLineage()
      ]);
    } catch (err) {
      showToast(err.message || 'Failed to execute Data Quality Audit.', 'error');
    } finally {
      setDataQualityAuditRunning(false);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        adminService.getWarehouseOverview(),
        adminService.getWarehouseSalesTrend(timeGrain),
        adminService.getWarehouseTopProducts(5)
      ]);

      // Ignore responses from superseded requests
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const [overviewResult, trendResult, topResult] = results;

      // Handle Executive Overview
      if (overviewResult.status === 'fulfilled') {
        const overview = overviewResult.value?.data || overviewResult.value;
        if (overview?.kpis) {
          setOverviewData(overview);
        } else {
          setOverviewData(null);
          showToast('Executive overview data format was unexpected.', 'error');
        }
      } else {
        setOverviewData(null);
        showToast(overviewResult.reason?.message || 'Failed to load executive overview.', 'error');
      }

      // Handle Sales Trend (clear stale data on failure)
      if (trendResult.status === 'fulfilled') {
        const trend = trendResult.value?.data || trendResult.value;
        if (Array.isArray(trend)) {
          setSalesTrend(trend);
        } else if (Array.isArray(trend?.data)) {
          setSalesTrend(trend.data);
        } else {
          setSalesTrend([]);
        }
      } else {
        setSalesTrend([]);
        showToast(trendResult.reason?.message || 'Failed to load sales trend data.', 'error');
      }

      // Handle Top Products (clear stale data on failure)
      if (topResult.status === 'fulfilled') {
        const top = topResult.value?.data || topResult.value;
        if (Array.isArray(top)) {
          setTopProducts(top);
        } else if (Array.isArray(top?.data)) {
          setTopProducts(top.data);
        } else {
          setTopProducts([]);
        }
      } else {
        setTopProducts([]);
        showToast(topResult.reason?.message || 'Failed to load top products data.', 'error');
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        showToast(err.message || 'Error loading BI Dashboard data.', 'error');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [timeGrain, showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchAssociationRules = useCallback(async () => {
    try {
      const res = await adminService.getAssociationRules(minSupport, minConfidence, 1.0, maxItemsetSize);
      if (Array.isArray(res)) {
        setAssociationRules(res);
        setAssociationRulesMeta(res.meta || null);
      } else if (res && Array.isArray(res.data)) {
        setAssociationRules(res.data);
        setAssociationRulesMeta(res.meta || null);
      } else {
        setAssociationRules([]);
        setAssociationRulesMeta(null);
      }
    } catch (err) {
      console.error('Failed to load association rules:', err);
    }
  }, [minSupport, minConfidence, maxItemsetSize]);

  useEffect(() => {
    fetchAssociationRules();
  }, [fetchAssociationRules]);

  const fetchCustomerSegments = useCallback(async () => {
    setCustomerSegmentsError(false);
    try {
      const res = await adminService.getCustomerSegments();
      if (res && res.clusters) {
        setCustomerSegments(res);
      } else if (res && res.data && res.data.clusters) {
        setCustomerSegments(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer segments:', err);
      setCustomerSegmentsError(true);
    }
  }, []);

  useEffect(() => {
    fetchCustomerSegments();
  }, [fetchCustomerSegments]);

  const fetchOlapCube = useCallback(async () => {
    setOlapLoading(true);
    setOlapError(false);
    try {
      const res = await adminService.getOlapCube({
        timeGrain: olapTimeGrain,
        cubeMode: olapCubeMode,
        metric: olapMetric,
        categoryId: olapCategoryId !== 'all' ? olapCategoryId : undefined,
        quarter: olapQuarter !== 'all' ? olapQuarter : undefined,
        priceTier: olapPriceTier !== 'all' ? olapPriceTier : undefined,
        activityTier: olapActivityTier !== 'all' ? olapActivityTier : undefined
      });
      const data = res?.data || res;
      setOlapData(data);
    } catch (err) {
      console.error('Failed to load OLAP cube data:', err);
      setOlapError(true);
    } finally {
      setOlapLoading(false);
    }
  }, [olapTimeGrain, olapCubeMode, olapMetric, olapCategoryId, olapQuarter, olapPriceTier, olapActivityTier]);

  useEffect(() => {
    fetchOlapCube();
  }, [fetchOlapCube]);

  const fetchChurnPredictions = useCallback(async () => {
    const currentRequestId = ++churnRequestIdRef.current;
    setChurnLoading(true);
    setChurnError(false);
    try {
      const res = await adminService.getChurnPredictions({
        riskLevel: churnRiskFilter,
        sortBy: churnSortBy,
        limit: 50
      });
      if (currentRequestId !== churnRequestIdRef.current) {
        return;
      }
      const data = res?.data || res;
      setChurnData(data);
    } catch (err) {
      if (currentRequestId === churnRequestIdRef.current) {
        console.error('Failed to load churn predictions:', err);
        setChurnError(true);
      }
    } finally {
      if (currentRequestId === churnRequestIdRef.current) {
        setChurnLoading(false);
      }
    }
  }, [churnRiskFilter, churnSortBy]);

  useEffect(() => {
    fetchChurnPredictions();
  }, [fetchChurnPredictions]);

  const handleTriggerOutreach = (customer) => {
    setOutreachSentMap(prev => ({ ...prev, [customer.customerId]: true }));
    showToast(`Retention action marked for ${customer.fullName}: "${customer.prescriptiveAction}"`, 'success');
  };

  const handleTriggerETL = async () => {
    try {
      setEtlRefreshing(true);
      const res = await adminService.triggerWarehouseEtl();
      showToast(res.message || 'ETL Warehouse refresh completed successfully!', 'success');
      await Promise.all([
        fetchDashboardData(),
        fetchOlapCube(),
        fetchChurnPredictions(),
        fetchDataQuality(),
        fetchDataLineage()
      ]);
    } catch (err) {
      showToast(err.message || 'Failed to trigger ETL refresh.', 'error');
    } finally {
      setEtlRefreshing(false);
    }
  };

  const kpis = overviewData?.kpis || null;
  const categoryShare = overviewData?.categoryShare || [];
  const customerTiers = overviewData?.customerTiers || [];
  const priceTiers = overviewData?.priceTiers || [];
  const etlHealth = overviewData?.etlHealth || {};

  return (
    <div className="space-y-8 pb-16 max-w-7xl">
      <BiHeader
        loading={loading}
        etlRefreshing={etlRefreshing}
        timeGrain={timeGrain}
        setTimeGrain={setTimeGrain}
        etlHealth={etlHealth}
        handleTriggerETL={handleTriggerETL}
      />

      <WarehouseOverviewPanel
        loading={loading}
        timeGrain={timeGrain}
        salesTrend={salesTrend}
        kpis={kpis}
        categoryShare={categoryShare}
        customerTiers={customerTiers}
        priceTiers={priceTiers}
      />

      <AssociationRulesPanel
        associationRules={associationRules}
        associationRulesMeta={associationRulesMeta}
        minSupport={minSupport}
        setMinSupport={setMinSupport}
        minConfidence={minConfidence}
        setMinConfidence={setMinConfidence}
        rulesLimit={rulesLimit}
        setRulesLimit={setRulesLimit}
        maxItemsetSize={maxItemsetSize}
        setMaxItemsetSize={setMaxItemsetSize}
      />

      <CustomerSegmentsPanel
        customerSegments={customerSegments}
        customerSegmentsError={customerSegmentsError}
        fetchCustomerSegments={fetchCustomerSegments}
        selectedClusterFilter={selectedClusterFilter}
        setSelectedClusterFilter={setSelectedClusterFilter}
        hoveredCustomerPoint={hoveredCustomerPoint}
        setHoveredCustomerPoint={setHoveredCustomerPoint}
      />

      <OlapExplorerPanel
        olapLoading={olapLoading}
        olapData={olapData}
        olapError={olapError}
        olapTimeGrain={olapTimeGrain}
        setOlapTimeGrain={setOlapTimeGrain}
        olapCubeMode={olapCubeMode}
        setOlapCubeMode={setOlapCubeMode}
        olapMetric={olapMetric}
        setOlapMetric={setOlapMetric}
        olapCategoryId={olapCategoryId}
        setOlapCategoryId={setOlapCategoryId}
        olapQuarter={olapQuarter}
        setOlapQuarter={setOlapQuarter}
        olapPriceTier={olapPriceTier}
        setOlapPriceTier={setOlapPriceTier}
        olapActivityTier={olapActivityTier}
        setOlapActivityTier={setOlapActivityTier}
        hoveredOlapCell={hoveredOlapCell}
        setHoveredOlapCell={setHoveredOlapCell}
        showSqlPreview={showSqlPreview}
        setShowSqlPreview={setShowSqlPreview}
        fetchOlapCube={fetchOlapCube}
      />

      <ChurnPanel
        churnLoading={churnLoading}
        churnData={churnData}
        churnError={churnError}
        churnRiskFilter={churnRiskFilter}
        setChurnRiskFilter={setChurnRiskFilter}
        churnSortBy={churnSortBy}
        setChurnSortBy={setChurnSortBy}
        churnSearchQuery={churnSearchQuery}
        setChurnSearchQuery={setChurnSearchQuery}
        selectedChurnCustomer={selectedChurnCustomer}
        setSelectedChurnCustomer={setSelectedChurnCustomer}
        showDecisionTreeModal={showDecisionTreeModal}
        setShowDecisionTreeModal={setShowDecisionTreeModal}
        outreachSentMap={outreachSentMap}
        handleTriggerOutreach={handleTriggerOutreach}
        fetchChurnPredictions={fetchChurnPredictions}
      />

      <DataGovernancePanel
        etlRefreshing={etlRefreshing}
        dataQualityLoading={dataQualityLoading}
        dataQualityData={dataQualityData}
        dataQualityAuditRunning={dataQualityAuditRunning}
        dataLineageData={dataLineageData}
        qualityActiveTab={qualityActiveTab}
        setQualityActiveTab={setQualityActiveTab}
        selectedLineageTier={selectedLineageTier}
        setSelectedLineageTier={setSelectedLineageTier}
        selectedLineageNodeId={selectedLineageNodeId}
        setSelectedLineageNodeId={setSelectedLineageNodeId}
        showLineageDetailModal={showLineageDetailModal}
        setShowLineageDetailModal={setShowLineageDetailModal}
        expandedTableRows={expandedTableRows}
        setExpandedTableRows={setExpandedTableRows}
        expandedEtlRuns={expandedEtlRuns}
        setExpandedEtlRuns={setExpandedEtlRuns}
        handleTriggerETL={handleTriggerETL}
        handleRunQualityAudit={handleRunQualityAudit}
      />
    </div>
  );
}
