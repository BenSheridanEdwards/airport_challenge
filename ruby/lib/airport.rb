require_relative 'plane'
require_relative 'weather'

class Airport

  DEFAULT_CAPACITY = 5

  attr_accessor :hangar
  attr_accessor :weather
  attr_reader :capacity

  def initialize(weather = Weather.new, capacity = DEFAULT_CAPACITY)
    @hangar = []
    @capacity = capacity
    @weather = weather
  end

  def land(plane)
    raise 'Hangar full, abort landing!' if hangar_full?

    raise 'That plane is already here' if landed?(plane)

    raise 'Stormy weather, abort landing!' if stormy?

    plane.landed
    @hangar << plane
  end

  def take_off(plane)
    raise "That plane isn't here" unless landed?(plane)

    raise "Stormy weather, cannot take off" if stormy?

    plane.take_off
    hangar.delete(plane)
  end

 private

  def hangar_full?
    @hangar.count >= @capacity
  end

  def landed?(plane)
    hangar.include?(plane)
  end

  def stormy?
    @weather.stormy?
  end

end
