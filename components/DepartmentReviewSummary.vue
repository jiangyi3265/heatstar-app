<template>
  <view v-if="ballot" class="section-block surface ballot-summary">
    <text class="section-title">{{ department }} · 部门评审小组</text>
    <text class="ballot-summary__rule">每人 1 至 3 星，班组长评分不计入。全员评完再结算；三星人数达到 80% 进入公司审核。</text>
    <view class="ballot-summary__totals">
      <text>已评 {{ votes.length }} / {{ members.length }} 人</text>
      <text>总分 {{ ballot.totalScore || 0 }} / {{ members.length * 3 }}</text>
      <text>三星 {{ ballot.threeStarCount || 0 }} / {{ members.length }} 人（需 {{ Math.ceil(members.length * 0.8) }} 人）</text>
    </view>
    <text v-if="!members.length" class="ballot-summary__rule">尚未配置有效部门评审员，请联系管理员。首次评分时由服务器确认名单。</text>
    <view v-for="member in members" :key="member.workNo" class="ballot-summary__member">
      <text>{{ member.name }}（{{ member.workNo }}）</text><text>{{ voteLabel(member.workNo) }}</text>
    </view>
    <text v-if="ballot.completed" class="ballot-summary__result">部门评审均分向下取整：{{ ballot.averageStars }} 星。{{ proposal.companyRoute === 'threshold' ? '三星人数已达 80%，已上报公司。' : proposal.companyRoute === 'specialist' ? '精益专员已推荐公司审核。' : '未达上报比例，在部门结案；精益专员仍可推荐。' }}</text>
    <text v-if="proposal.recommendation" class="ballot-summary__rule">推荐人：{{ proposal.recommendation.name }}；原因：{{ proposal.recommendation.reason }}</text>
  </view>
</template>
<script>
import { departmentName } from '../utils/organization.js'
export default {
  props: { proposal: { type: Object, required: true } },
  computed: {
    department() { return departmentName(this.proposal) },
    ballot() { return this.proposal.departmentReview },
    members() { return this.ballot?.members || [] },
    votes() { return this.ballot?.votes || [] }
  },
  methods: { voteLabel(workNo) { const vote = this.votes.find(v => v.workNo === workNo); return !vote ? '待评分' : vote.decision === 'reject' ? '已驳回' : `${vote.stars} 星` } }
}
</script>
<style scoped>
.ballot-summary { padding: 24rpx; }
.ballot-summary__rule { display: block; margin-top: 12rpx; color: #5f666b; font-size: 24rpx; line-height: 1.7; }
.ballot-summary__totals { display: flex; flex-wrap: wrap; gap: 12rpx 24rpx; margin: 20rpx 0; font-size: 26rpx; font-weight: 650; }
.ballot-summary__member { display: flex; justify-content: space-between; gap: 20rpx; padding: 16rpx 0; border-top: 1rpx solid #deddd7; font-size: 25rpx; }
.ballot-summary__result { display: block; margin-top: 16rpx; color: #375f76; font-size: 25rpx; line-height: 1.7; }
</style>
