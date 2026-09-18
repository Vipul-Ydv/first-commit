const User = require('../models/User');

class MatchingAlgorithm {
  static calculateSkillMatch(userSkills, teamRequiredSkills) {
    if (!userSkills.length || !teamRequiredSkills.length) return 0;
    
    const userSkillNames = userSkills.map(s => s.name.toLowerCase());
    const matchCount = teamRequiredSkills.filter(skill => 
      userSkillNames.includes(skill.toLowerCase())
    ).length;
    
    return (matchCount / teamRequiredSkills.length) * 100;
  }

  static calculateInterestMatch(userInterests, teamInterests) {
    if (!userInterests.length || !teamInterests.length) return 0;
    
    const matchCount = teamInterests.filter(interest => 
      userInterests.includes(interest)
    ).length;
    
    return (matchCount / teamInterests.length) * 100;
  }

  static calculateComplementaryScore(userSkills, teamMembers) {
    if (!teamMembers.length) return 50;
    
    const teamSkills = teamMembers.flatMap(member => 
      member.user?.skills?.map(s => s.name.toLowerCase()) || []
    );
    
    const uniqueUserSkills = userSkills
      .map(s => s.name.toLowerCase())
      .filter(skill => !teamSkills.includes(skill));
    
    return uniqueUserSkills.length > 0 ? 
      Math.min(uniqueUserSkills.length * 20, 100) : 0;
  }

  static async findBestTeams(user, teams, limit = 10) {
    const scoredTeams = await Promise.all(teams.map(async team => {
      await team.populate('members.user');
      
      const skillMatch = this.calculateSkillMatch(
        user.skills, 
        team.requiredSkills
      );
      
      const interestMatch = this.calculateInterestMatch(
        user.interests, 
        team.requiredSkills
      );
      
      const complementaryScore = this.calculateComplementaryScore(
        user.skills, 
        team.members
      );
      
      const availabilityBonus = team.isOpen ? 20 : 0;
      const slotBonus = (team.maxMembers - team.members.length) * 5;
      
      const totalScore = (
        skillMatch * 0.4 + 
        interestMatch * 0.3 + 
        complementaryScore * 0.2 +
        availabilityBonus + 
        slotBonus
      );
      
      return {
        team,
        score: totalScore,
        breakdown: {
          skillMatch,
          interestMatch,
          complementaryScore,
          availabilityBonus,
          slotBonus
        }
      };
    }));

    return scoredTeams
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  static async findBestTeammates(team, users, limit = 10) {
    const scoredUsers = users.map(user => {
      const skillMatch = this.calculateSkillMatch(
        user.skills, 
        team.requiredSkills
      );
      
      const interestMatch = this.calculateInterestMatch(
        user.interests, 
        team.requiredSkills
      );
      
      const complementaryScore = this.calculateComplementaryScore(
        user.skills, 
        team.members
      );
      
      const totalScore = (
        skillMatch * 0.4 + 
        interestMatch * 0.3 + 
        complementaryScore * 0.3
      );
      
      return {
        user,
        score: totalScore,
        breakdown: {
          skillMatch,
          interestMatch,
          complementaryScore
        }
      };
    });

    return scoredUsers
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = MatchingAlgorithm;
