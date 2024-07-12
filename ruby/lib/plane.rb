class Plane

  attr_reader :airborne

  def initialize(airborne = false)
    @airborne = airborne
  end

  def take_off
    @airborne = true
  end

  def landed
    @airborne = false
  end

  def airborne?
    @airborne
  end
end
