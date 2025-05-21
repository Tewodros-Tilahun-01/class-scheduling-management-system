import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/Card2";
import Button from "../../ui/Button2";
import Badge from "../../ui/Badge";
import { Plus, X } from "lucide-react";

const SkillsSection = ({ skills, onAddSkill, onRemoveSkill }) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newSkill, setNewSkill] = React.useState({
    name: "",
    level: "intermediate",
  });

  const handleAddSkill = () => {
    if (newSkill.name.trim() && onAddSkill) {
      onAddSkill({
        id: Math.random().toString(36).substr(2, 9),
        ...newSkill,
      });
      setNewSkill({ name: "", level: "intermediate" });
      setIsAdding(false);
    }
  };

  const skillLevelColors = {
    beginner: "bg-blue-100 text-blue-800",
    intermediate: "bg-green-100 text-green-800",
    advanced: "bg-purple-100 text-purple-800",
    expert: "bg-orange-100 text-orange-800",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Skills & Expertise</CardTitle>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsAdding(true)}
          >
            Add Skill
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="text-sm font-medium mb-2">Add New Skill</div>
            <div className="flex flex-col space-y-3">
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) =>
                  setNewSkill({ ...newSkill, name: e.target.value })
                }
                placeholder="Skill name"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newSkill.level}
                onChange={(e) =>
                  setNewSkill({ ...newSkill, level: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddSkill}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
            >
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {skill.name}
                </span>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    skillLevelColors[skill.level]
                  }`}
                >
                  {skill.level}
                </span>
              </div>
              {onRemoveSkill && (
                <button
                  onClick={() => onRemoveSkill(skill.id)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={`Remove ${skill.name}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {skills.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No skills added yet. Click "Add Skill" to add your expertise.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillsSection;
